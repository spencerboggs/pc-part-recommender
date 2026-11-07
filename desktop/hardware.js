/*
 * Windows hardware detection via WMI/CIM and the Storage module.
 * PSU model and wattage are not exposed through a generic Windows interface.
 */
const { execFile } = require('child_process');

const PS_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
function SafeInt($value) {
  try { return [int64]$value } catch { return [int64]0 }
}

$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object {
  [pscustomobject]@{
    name = "$($_.Name)".Trim()
    vendor = "$($_.AdapterCompatibility)".Trim()
    driver = "$($_.DriverVersion)".Trim()
  }
})
$modules = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object {
  [pscustomobject]@{
    capacity = SafeInt $_.Capacity
    speed = SafeInt $_.Speed
    configured = SafeInt $_.ConfiguredClockSpeed
    smbios = SafeInt $_.SMBIOSMemoryType
    manufacturer = "$($_.Manufacturer)".Trim()
    part = "$($_.PartNumber)".Trim()
  }
})
$slots = 0
$array = Get-CimInstance Win32_PhysicalMemoryArray | Select-Object -First 1
if ($array) { $slots = SafeInt $array.MemoryDevices }

$physical = @(Get-PhysicalDisk | Where-Object { $_.BusType -ne 'USB' })
$disks = @()
if ($physical.Count -gt 0) {
  $disks = @($physical | ForEach-Object {
    [pscustomobject]@{
      model = "$($_.FriendlyName)".Trim()
      size = SafeInt $_.Size
      media = "$($_.MediaType)"
      bus = "$($_.BusType)"
    }
  })
} else {
  $disks = @(Get-CimInstance Win32_DiskDrive | Where-Object { $_.InterfaceType -ne 'USB' } | ForEach-Object {
    [pscustomobject]@{
      model = "$($_.Model)".Trim()
      size = SafeInt $_.Size
      media = "$($_.MediaType)"
      bus = "$($_.InterfaceType)"
    }
  })
}

[pscustomobject]@{
  cpu = [pscustomobject]@{
    model = if ($cpu) { "$($cpu.Name)".Trim() } else { '' }
    cores = if ($cpu) { SafeInt $cpu.NumberOfCores } else { 0 }
    threads = if ($cpu) { SafeInt $cpu.NumberOfLogicalProcessors } else { 0 }
    socket = if ($cpu) { "$($cpu.SocketDesignation)".Trim() } else { '' }
    clock = if ($cpu) { SafeInt $cpu.MaxClockSpeed } else { 0 }
  }
  gpus = $gpus
  modules = $modules
  slots = $slots
  disks = $disks
} | ConvertTo-Json -Compress -Depth 6
`;

function runPowerShell(script, timeoutMs) {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
      { windowsHide: true, timeout: timeoutMs || 25000, maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          error.message = (stderr || error.message || '').trim();
          reject(error);
          return;
        }
        resolve(String(stdout || '').replace(/^\uFEFF/, '').trim());
      }
    );
  });
}

function cleanName(value) {
  return String(value || '')
    .replace(/\((R|TM|C)\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCpu(name) {
  return cleanName(name)
    .replace(/\bCPU\b/gi, '')
    .replace(/\bProcessor\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function vendorFor(raw, name) {
  const text = String(raw || '') + ' ' + String(name || '');
  if (/nvidia/i.test(text)) return 'NVIDIA';
  if (/advanced micro|amd|radeon|ati/i.test(text)) return 'AMD';
  if (/intel/i.test(text)) return 'Intel';
  return cleanName(raw);
}

function gpuRank(gpu) {
  const name = String(gpu.name || '');
  const vendor = String(gpu.vendor || '');
  let score = 0;
  if (gpu.vendor === 'NVIDIA') score = 40;
  else if (gpu.vendor === 'AMD') score = 35;
  else if (gpu.vendor === 'Intel' && /arc/i.test(name)) score = 30;
  else if (gpu.vendor === 'Intel') score = 10;
  if (/geforce|radeon rx|arc/i.test(name)) score += 10;
  if (/basic display|remote display|virtual/i.test(name + ' ' + vendor)) score -= 30;
  if (/rtx|rx 9|rx 7|rx 6|arc b/i.test(name)) score += 5;
  return score;
}

function memoryGen(modules) {
  const counts = { DDR5: 0, DDR4: 0, DDR3: 0 };
  for (const m of modules) {
    if (m.smbios === 34) counts.DDR5 += 1;
    else if (m.smbios === 26) counts.DDR4 += 1;
    else if (m.smbios === 24) counts.DDR3 += 1;
  }
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return counts[best] > 0 ? best : null;
}

function driveKind(disk) {
  const bus = String(disk.bus || '').toLowerCase();
  const media = String(disk.media || '').toLowerCase();
  if (bus.includes('nvme')) return 'NVMe SSD';
  if (media.includes('ssd')) return bus.includes('sata') ? 'SATA SSD' : 'NVMe SSD';
  if (media.includes('hdd') || media.includes('fixed hard')) return 'HDD';
  if (bus.includes('sata')) return 'SATA SSD';
  return 'NVMe SSD';
}

function mapHardware(raw) {
  const cpuRaw = raw.cpu || {};
  const cpus = {
    model: cleanCpu(cpuRaw.model),
    cores: Number(cpuRaw.cores) || 0,
    threads: Number(cpuRaw.threads) || 0,
    socket: cleanName(cpuRaw.socket),
    clock: Number(cpuRaw.clock) || 0
  };

  const gpus = (raw.gpus || [])
    .map((g) => ({
      model: cleanName(g.name),
      vendor: vendorFor(g.vendor, g.name),
      driver: cleanName(g.driver)
    }))
    .filter((g) => g.model && !/basic display|remote display|virtual display/i.test(g.model))
    .sort((a, b) => gpuRank(b) - gpuRank(a));

  const modules = (raw.modules || []).map((m) => ({
    capacityGB: Math.round((Number(m.capacity) || 0) / (1024 * 1024 * 1024)),
    speed: Number(m.configured) || Number(m.speed) || 0,
    smbios: Number(m.smbios) || 0,
    manufacturer: cleanName(m.manufacturer),
    part: cleanName(m.part)
  }));

  const totalGB = modules.reduce((sum, m) => sum + m.capacityGB, 0);
  const gen = memoryGen(modules);
  const speeds = modules.map((m) => m.speed).filter(Boolean);
  const speed = speeds.length ? Math.max.apply(null, speeds) : null;
  const used = modules.length;
  const totalSlots = Math.max(Number(raw.slots) || 0, used, 1);

  const storage = (raw.disks || [])
    .map((d) => ({
      model: cleanName(d.model),
      capacityGB: Math.round((Number(d.size) || 0) / 1e9),
      kind: driveKind(d)
    }))
    .filter((d) => d.capacityGB > 0)
    .sort((a, b) => b.capacityGB - a.capacityGB)
    .slice(0, 4);

  const summaryCount = (cpus.model ? 1 : 0) + (gpus.length ? 1 : 0) + modules.length + storage.length;

  return {
    cpu: cpus,
    gpu: gpus[0] || null,
    gpus,
    ram: {
      totalGB,
      gen,
      speed,
      slotsUsed: used,
      slotsTotal: totalSlots,
      modules: modules.map((m) => ({ capacityGB: m.capacityGB, speed: m.speed }))
    },
    storage,
    psu: null,
    psuAvailable: false,
    summaryCount,
    capturedAt: new Date().toISOString()
  };
}

async function detectHardware() {
  if (process.platform !== 'win32') {
    const error = new Error('Automatic hardware detection is only available on Windows.');
    error.code = 'UNSUPPORTED_PLATFORM';
    throw error;
  }
  const output = await runPowerShell(PS_SCRIPT, 25000);
  if (!output) throw new Error('The hardware query returned no data.');
  let raw;
  try {
    raw = JSON.parse(output);
  } catch (err) {
    throw new Error('Could not read the hardware query output.');
  }
  return mapHardware(raw);
}

module.exports = { detectHardware, mapHardware };
