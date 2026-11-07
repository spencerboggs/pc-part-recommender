/*
 * PC Upgrade Advisor parts catalog.
 * GPU, CPU and memory prices come from prices.js; storage and PSU prices are estimates.
 */
window.PCData = (function () {
  const cpus = [
    // ---- AMD AM5 (Zen 5 / Zen 4) ----
    { id: 'r9-9950x3d2', model: 'Ryzen 9 9950X3D2', brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, tdp: 200, price: 889, ddr: 'DDR5', year: 2026, buyable: true, perf: { gaming: 99, mt: 100 } },
    { id: 'r9-9950x3d', model: 'Ryzen 9 9950X3D', brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, tdp: 170, price: 699, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 100, mt: 92 } },
    { id: 'r9-9950x', model: 'Ryzen 9 9950X', brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, tdp: 170, price: 539, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 88, mt: 91 } },
    { id: 'r9-9900x3d', model: 'Ryzen 9 9900X3D', brand: 'AMD', socket: 'AM5', cores: 12, threads: 24, tdp: 120, price: 599, ddr: 'DDR5', year: 2025, buyable: true, perf: { gaming: 97, mt: 73 } },
    { id: 'r9-9900x', model: 'Ryzen 9 9900X', brand: 'AMD', socket: 'AM5', cores: 12, threads: 24, tdp: 120, price: 358, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 85, mt: 72 } },
    { id: 'r7-9800x3d', model: 'Ryzen 7 9800X3D', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, tdp: 120, price: 429, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 100, mt: 52 } },
    { id: 'r7-9700x', model: 'Ryzen 7 9700X', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, tdp: 65, price: 289, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 82, mt: 50 } },
    { id: 'r5-9600x', model: 'Ryzen 5 9600X', brand: 'AMD', socket: 'AM5', cores: 6, threads: 12, tdp: 65, price: 199, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 78, mt: 38 } },
    { id: 'r5-9600', model: 'Ryzen 5 9600', brand: 'AMD', socket: 'AM5', cores: 6, threads: 12, tdp: 65, price: 179, ddr: 'DDR5', year: 2025, buyable: true, perf: { gaming: 76, mt: 37 } },
    { id: 'r7-7800x3d', model: 'Ryzen 7 7800X3D', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, tdp: 120, price: 339, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 94, mt: 45 } },
    { id: 'r7-7700x', model: 'Ryzen 7 7700X', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, tdp: 105, price: 249, ddr: 'DDR5', year: 2022, buyable: true, perf: { gaming: 79, mt: 44 } },
    { id: 'r7-7700', model: 'Ryzen 7 7700', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, tdp: 65, price: 229, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 78, mt: 42 } },
    { id: 'r5-7600x', model: 'Ryzen 5 7600X', brand: 'AMD', socket: 'AM5', cores: 6, threads: 12, tdp: 105, price: 169, ddr: 'DDR5', year: 2022, buyable: true, perf: { gaming: 75, mt: 33 } },
    { id: 'r5-7600', model: 'Ryzen 5 7600', brand: 'AMD', socket: 'AM5', cores: 6, threads: 12, tdp: 65, price: 149, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 73, mt: 32 } },
    { id: 'r9-7950x3d', model: 'Ryzen 9 7950X3D', brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, tdp: 120, price: 649, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 92, mt: 70 } },
    { id: 'r9-7950x', model: 'Ryzen 9 7950X', brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, tdp: 170, price: 499, ddr: 'DDR5', year: 2022, buyable: true, perf: { gaming: 82, mt: 68 } },
    { id: 'r9-7900x', model: 'Ryzen 9 7900X', brand: 'AMD', socket: 'AM5', cores: 12, threads: 24, tdp: 170, price: 399, ddr: 'DDR5', year: 2022, buyable: true, perf: { gaming: 80, mt: 64 } },
    { id: 'r9-7900', model: 'Ryzen 9 7900', brand: 'AMD', socket: 'AM5', cores: 12, threads: 24, tdp: 65, price: 349, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 78, mt: 62 } },

    // ---- AMD AM4 ----
    { id: 'r7-5800x3d', model: 'Ryzen 7 5800X3D', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, tdp: 105, price: 279, ddr: 'DDR4', year: 2022, buyable: true, perf: { gaming: 80, mt: 28 } },
    { id: 'r7-5700x3d', model: 'Ryzen 7 5700X3D', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, tdp: 105, price: 209, ddr: 'DDR4', year: 2024, buyable: true, perf: { gaming: 76, mt: 26 } },
    { id: 'r7-5800x', model: 'Ryzen 7 5800X', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, tdp: 105, price: 169, ddr: 'DDR4', year: 2020, buyable: true, perf: { gaming: 66, mt: 27 } },
    { id: 'r7-5700x', model: 'Ryzen 7 5700X', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, tdp: 65, price: 159, ddr: 'DDR4', year: 2022, buyable: true, perf: { gaming: 62, mt: 25 } },
    { id: 'r5-5600x', model: 'Ryzen 5 5600X', brand: 'AMD', socket: 'AM4', cores: 6, threads: 12, tdp: 65, price: 129, ddr: 'DDR4', year: 2020, buyable: true, perf: { gaming: 60, mt: 19 } },
    { id: 'r5-5600', model: 'Ryzen 5 5600', brand: 'AMD', socket: 'AM4', cores: 6, threads: 12, tdp: 65, price: 109, ddr: 'DDR4', year: 2022, buyable: true, perf: { gaming: 58, mt: 19 } },
    { id: 'r9-5950x', model: 'Ryzen 9 5950X', brand: 'AMD', socket: 'AM4', cores: 16, threads: 32, tdp: 105, price: 349, ddr: 'DDR4', year: 2020, buyable: true, perf: { gaming: 66, mt: 38 } },
    { id: 'r9-5900x', model: 'Ryzen 9 5900X', brand: 'AMD', socket: 'AM4', cores: 12, threads: 24, tdp: 105, price: 279, ddr: 'DDR4', year: 2020, buyable: true, perf: { gaming: 64, mt: 33 } },
    { id: 'r5-3600x', model: 'Ryzen 5 3600X', brand: 'AMD', socket: 'AM4', cores: 6, threads: 12, tdp: 95, price: 89, ddr: 'DDR4', year: 2019, buyable: false, perf: { gaming: 46, mt: 14 } },
    { id: 'r5-3600', model: 'Ryzen 5 3600', brand: 'AMD', socket: 'AM4', cores: 6, threads: 12, tdp: 65, price: 79, ddr: 'DDR4', year: 2019, buyable: true, perf: { gaming: 44, mt: 13 } },
    { id: 'r7-3800x', model: 'Ryzen 7 3800X', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, tdp: 105, price: 119, ddr: 'DDR4', year: 2019, buyable: false, perf: { gaming: 50, mt: 19 } },
    { id: 'r9-3900x', model: 'Ryzen 9 3900X', brand: 'AMD', socket: 'AM4', cores: 12, threads: 24, tdp: 105, price: 199, ddr: 'DDR4', year: 2019, buyable: false, perf: { gaming: 53, mt: 26 } },
    { id: 'r7-3700x', model: 'Ryzen 7 3700X', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, tdp: 65, price: 99, ddr: 'DDR4', year: 2019, buyable: true, perf: { gaming: 48, mt: 18 } },
    { id: 'r5-2600', model: 'Ryzen 5 2600', brand: 'AMD', socket: 'AM4', cores: 6, threads: 12, tdp: 65, price: 55, ddr: 'DDR4', year: 2018, buyable: false, perf: { gaming: 32, mt: 10 } },
    { id: 'r7-1700', model: 'Ryzen 7 1700', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, tdp: 65, price: 40, ddr: 'DDR4', year: 2017, buyable: false, perf: { gaming: 25, mt: 9 } },
    { id: 'r5-1600', model: 'Ryzen 5 1600', brand: 'AMD', socket: 'AM4', cores: 6, threads: 12, tdp: 65, price: 35, ddr: 'DDR4', year: 2017, buyable: false, perf: { gaming: 22, mt: 8 } },

    // ---- Intel LGA1851 (Core Ultra 200S) ----
    { id: 'u7-270k-plus', model: 'Core Ultra 7 270K Plus', brand: 'Intel', socket: 'LGA1851', cores: 24, threads: 24, tdp: 125, price: 429, ddr: 'DDR5', year: 2026, buyable: true, perf: { gaming: 90, mt: 100 } },
    { id: 'u9-285k', model: 'Core Ultra 9 285K', brand: 'Intel', socket: 'LGA1851', cores: 24, threads: 24, tdp: 125, price: 569, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 88, mt: 99 } },
    { id: 'u7-265k', model: 'Core Ultra 7 265K', brand: 'Intel', socket: 'LGA1851', cores: 20, threads: 20, tdp: 125, price: 299, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 85, mt: 88 } },
    { id: 'u7-265kf', model: 'Core Ultra 7 265KF', brand: 'Intel', socket: 'LGA1851', cores: 20, threads: 20, tdp: 125, price: 279, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 85, mt: 88 } },
    { id: 'u5-250k-plus', model: 'Core Ultra 5 250K Plus', brand: 'Intel', socket: 'LGA1851', cores: 18, threads: 18, tdp: 125, price: 269, ddr: 'DDR5', year: 2026, buyable: true, perf: { gaming: 82, mt: 78 } },
    { id: 'u5-245k', model: 'Core Ultra 5 245K', brand: 'Intel', socket: 'LGA1851', cores: 14, threads: 14, tdp: 125, price: 249, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 80, mt: 72 } },
    { id: 'u5-225f', model: 'Core Ultra 5 225F', brand: 'Intel', socket: 'LGA1851', cores: 10, threads: 10, tdp: 65, price: 179, ddr: 'DDR5', year: 2025, buyable: true, perf: { gaming: 70, mt: 55 } },

    // ---- Intel LGA1700 ----
    { id: 'i9-14900k', model: 'Core i9-14900K', brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, tdp: 125, price: 439, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 87, mt: 93 } },
    { id: 'i7-14700k', model: 'Core i7-14700K', brand: 'Intel', socket: 'LGA1700', cores: 20, threads: 28, tdp: 125, price: 329, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 84, mt: 85 } },
    { id: 'i5-14600k', model: 'Core i5-14600K', brand: 'Intel', socket: 'LGA1700', cores: 14, threads: 20, tdp: 125, price: 229, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 78, mt: 65 } },
    { id: 'i5-14400f', model: 'Core i5-14400F', brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, tdp: 65, price: 159, ddr: 'DDR5', year: 2024, buyable: true, perf: { gaming: 68, mt: 48 } },
    { id: 'i5-13400f', model: 'Core i5-13400F', brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, tdp: 65, price: 139, ddr: 'DDR5', year: 2023, buyable: true, perf: { gaming: 64, mt: 44 } },
    { id: 'i5-12600k', model: 'Core i5-12600K', brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, tdp: 125, price: 169, ddr: 'DDR5', year: 2021, buyable: true, perf: { gaming: 63, mt: 45 } },
    { id: 'i5-12400f', model: 'Core i5-12400F', brand: 'Intel', socket: 'LGA1700', cores: 6, threads: 12, tdp: 65, price: 119, ddr: 'DDR5', year: 2022, buyable: true, perf: { gaming: 55, mt: 35 } },
    { id: 'i7-12700k', model: 'Core i7-12700K', brand: 'Intel', socket: 'LGA1700', cores: 12, threads: 20, tdp: 125, price: 209, ddr: 'DDR5', year: 2021, buyable: true, perf: { gaming: 65, mt: 55 } },
    { id: 'i9-12900k', model: 'Core i9-12900K', brand: 'Intel', socket: 'LGA1700', cores: 16, threads: 24, tdp: 125, price: 269, ddr: 'DDR5', year: 2021, buyable: true, perf: { gaming: 68, mt: 62 } },

    // ---- Intel legacy sockets ----
    { id: 'i7-11700k', model: 'Core i7-11700K', brand: 'Intel', socket: 'LGA1200', cores: 8, threads: 16, tdp: 125, price: 149, ddr: 'DDR4', year: 2021, buyable: false, perf: { gaming: 52, mt: 34 } },
    { id: 'i7-10700k', model: 'Core i7-10700K', brand: 'Intel', socket: 'LGA1200', cores: 8, threads: 16, tdp: 125, price: 129, ddr: 'DDR4', year: 2020, buyable: false, perf: { gaming: 48, mt: 30 } },
    { id: 'i5-10400f', model: 'Core i5-10400F', brand: 'Intel', socket: 'LGA1200', cores: 6, threads: 12, tdp: 65, price: 79, ddr: 'DDR4', year: 2020, buyable: false, perf: { gaming: 40, mt: 22 } },
    { id: 'i7-8700k', model: 'Core i7-8700K', brand: 'Intel', socket: 'LGA1151', cores: 6, threads: 12, tdp: 95, price: 89, ddr: 'DDR4', year: 2017, buyable: false, perf: { gaming: 38, mt: 20 } },
    { id: 'i5-8400', model: 'Core i5-8400', brand: 'Intel', socket: 'LGA1151', cores: 6, threads: 6, tdp: 65, price: 59, ddr: 'DDR4', year: 2017, buyable: false, perf: { gaming: 30, mt: 15 } },
    { id: 'i7-6700k', model: 'Core i7-6700K', brand: 'Intel', socket: 'LGA1151', cores: 4, threads: 8, tdp: 91, price: 49, ddr: 'DDR4', year: 2015, buyable: false, perf: { gaming: 24, mt: 12 } },
    { id: 'i5-6600k', model: 'Core i5-6600K', brand: 'Intel', socket: 'LGA1151', cores: 4, threads: 4, tdp: 91, price: 35, ddr: 'DDR4', year: 2015, buyable: false, perf: { gaming: 20, mt: 9 } }
  ];

  const gpus = [
    // ---- NVIDIA RTX 50 (current) ----
    { id: 'rtx-5090', model: 'GeForce RTX 5090', brand: 'NVIDIA', vram: 32, tdp: 575, price: 1999, year: 2025, buyable: true, perf: { raster: 100, rt: 100 } },
    { id: 'rtx-5080', model: 'GeForce RTX 5080', brand: 'NVIDIA', vram: 16, tdp: 360, price: 999, year: 2025, buyable: true, perf: { raster: 61, rt: 70 } },
    { id: 'rtx-5070-ti', model: 'GeForce RTX 5070 Ti', brand: 'NVIDIA', vram: 16, tdp: 300, price: 749, year: 2025, buyable: true, perf: { raster: 48, rt: 58 } },
    { id: 'rtx-5070', model: 'GeForce RTX 5070', brand: 'NVIDIA', vram: 12, tdp: 250, price: 549, year: 2025, buyable: true, perf: { raster: 36, rt: 45 } },
    { id: 'rtx-5060-ti-16', model: 'GeForce RTX 5060 Ti 16GB', brand: 'NVIDIA', vram: 16, tdp: 180, price: 429, year: 2025, buyable: true, perf: { raster: 25, rt: 33 } },
    { id: 'rtx-5060-ti', model: 'GeForce RTX 5060 Ti', brand: 'NVIDIA', vram: 8, tdp: 180, price: 379, year: 2025, buyable: true, perf: { raster: 24, rt: 32 } },
    { id: 'rtx-5060', model: 'GeForce RTX 5060', brand: 'NVIDIA', vram: 8, tdp: 145, price: 299, year: 2025, buyable: true, perf: { raster: 21, rt: 29 } },
    { id: 'rtx-5050', model: 'GeForce RTX 5050', brand: 'NVIDIA', vram: 8, tdp: 130, price: 249, year: 2025, buyable: true, perf: { raster: 16, rt: 22 } },

    // ---- NVIDIA RTX 40 ----
    { id: 'rtx-4090', model: 'GeForce RTX 4090', brand: 'NVIDIA', vram: 24, tdp: 450, price: 1599, year: 2022, buyable: false, perf: { raster: 63, rt: 73 } },
    { id: 'rtx-4080-super', model: 'GeForce RTX 4080 Super', brand: 'NVIDIA', vram: 16, tdp: 320, price: 899, year: 2024, buyable: false, perf: { raster: 51, rt: 59 } },
    { id: 'rtx-4080', model: 'GeForce RTX 4080', brand: 'NVIDIA', vram: 16, tdp: 320, price: 799, year: 2022, buyable: false, perf: { raster: 48, rt: 56 } },
    { id: 'rtx-4070-ti-super', model: 'GeForce RTX 4070 Ti Super', brand: 'NVIDIA', vram: 16, tdp: 285, price: 699, year: 2024, buyable: false, perf: { raster: 42, rt: 49 } },
    { id: 'rtx-4070-ti', model: 'GeForce RTX 4070 Ti', brand: 'NVIDIA', vram: 12, tdp: 285, price: 599, year: 2023, buyable: false, perf: { raster: 37, rt: 44 } },
    { id: 'rtx-4070-super', model: 'GeForce RTX 4070 Super', brand: 'NVIDIA', vram: 12, tdp: 220, price: 549, year: 2024, buyable: false, perf: { raster: 35, rt: 42 } },
    { id: 'rtx-4070', model: 'GeForce RTX 4070', brand: 'NVIDIA', vram: 12, tdp: 200, price: 479, year: 2023, buyable: false, perf: { raster: 30, rt: 37 } },
    { id: 'rtx-4060-ti-16', model: 'GeForce RTX 4060 Ti 16GB', brand: 'NVIDIA', vram: 16, tdp: 165, price: 399, year: 2023, buyable: false, perf: { raster: 23, rt: 29 } },
    { id: 'rtx-4060-ti', model: 'GeForce RTX 4060 Ti', brand: 'NVIDIA', vram: 8, tdp: 160, price: 349, year: 2023, buyable: false, perf: { raster: 22, rt: 28 } },
    { id: 'rtx-4060', model: 'GeForce RTX 4060', brand: 'NVIDIA', vram: 8, tdp: 115, price: 279, year: 2023, buyable: true, perf: { raster: 16, rt: 22 } },

    // ---- NVIDIA RTX 30 / 20 / GTX ----
    { id: 'rtx-3090', model: 'GeForce RTX 3090', brand: 'NVIDIA', vram: 24, tdp: 350, price: 699, year: 2020, buyable: false, perf: { raster: 30, rt: 31 } },
    { id: 'rtx-3080-ti', model: 'GeForce RTX 3080 Ti', brand: 'NVIDIA', vram: 12, tdp: 350, price: 549, year: 2021, buyable: false, perf: { raster: 34, rt: 36 } },
    { id: 'rtx-3080', model: 'GeForce RTX 3080', brand: 'NVIDIA', vram: 10, tdp: 320, price: 399, year: 2020, buyable: false, perf: { raster: 30, rt: 32 } },
    { id: 'rtx-3070-ti', model: 'GeForce RTX 3070 Ti', brand: 'NVIDIA', vram: 8, tdp: 290, price: 329, year: 2021, buyable: false, perf: { raster: 24, rt: 26 } },
    { id: 'rtx-3070', model: 'GeForce RTX 3070', brand: 'NVIDIA', vram: 8, tdp: 220, price: 279, year: 2020, buyable: false, perf: { raster: 21, rt: 24 } },
    { id: 'rtx-3060-ti', model: 'GeForce RTX 3060 Ti', brand: 'NVIDIA', vram: 8, tdp: 200, price: 239, year: 2020, buyable: false, perf: { raster: 19, rt: 21 } },
    { id: 'rtx-3060', model: 'GeForce RTX 3060', brand: 'NVIDIA', vram: 12, tdp: 170, price: 199, year: 2021, buyable: false, perf: { raster: 16, rt: 17 } },
    { id: 'rtx-3050', model: 'GeForce RTX 3050', brand: 'NVIDIA', vram: 8, tdp: 130, price: 149, year: 2022, buyable: false, perf: { raster: 10, rt: 11 } },
    { id: 'rtx-2080-ti', model: 'GeForce RTX 2080 Ti', brand: 'NVIDIA', vram: 11, tdp: 250, price: 299, year: 2018, buyable: false, perf: { raster: 21, rt: 20 } },
    { id: 'rtx-2070-super', model: 'GeForce RTX 2070 Super', brand: 'NVIDIA', vram: 8, tdp: 215, price: 199, year: 2019, buyable: false, perf: { raster: 14, rt: 13 } },
    { id: 'rtx-2060', model: 'GeForce RTX 2060', brand: 'NVIDIA', vram: 6, tdp: 160, price: 139, year: 2019, buyable: false, perf: { raster: 10, rt: 9 } },
    { id: 'titan-xp', model: 'GeForce GTX Titan Xp', brand: 'NVIDIA', vram: 12, tdp: 250, price: 249, year: 2017, buyable: false, perf: { raster: 17.5, rt: 5 } },
    { id: 'gtx-1080-ti', model: 'GeForce GTX 1080 Ti', brand: 'NVIDIA', vram: 11, tdp: 250, price: 199, year: 2017, buyable: false, perf: { raster: 14, rt: 5 } },
    { id: 'gtx-1080', model: 'GeForce GTX 1080', brand: 'NVIDIA', vram: 8, tdp: 180, price: 119, year: 2016, buyable: false, perf: { raster: 10, rt: 3.5 } },
    { id: 'gtx-1660-super', model: 'GeForce GTX 1660 Super', brand: 'NVIDIA', vram: 6, tdp: 125, price: 119, year: 2019, buyable: false, perf: { raster: 8.5, rt: 4 } },
    { id: 'gtx-1070', model: 'GeForce GTX 1070', brand: 'NVIDIA', vram: 8, tdp: 150, price: 89, year: 2016, buyable: false, perf: { raster: 7.5, rt: 2.5 } },
    { id: 'gtx-1650', model: 'GeForce GTX 1650', brand: 'NVIDIA', vram: 4, tdp: 75, price: 79, year: 2019, buyable: false, perf: { raster: 5.5, rt: 2 } },
    { id: 'gtx-1060', model: 'GeForce GTX 1060 6GB', brand: 'NVIDIA', vram: 6, tdp: 120, price: 69, year: 2016, buyable: false, perf: { raster: 5, rt: 1.5 } },

    // ---- AMD Radeon RX 9000 (current) ----
    { id: 'rx-9070-xt', model: 'Radeon RX 9070 XT', brand: 'AMD', vram: 16, tdp: 304, price: 599, year: 2025, buyable: true, perf: { raster: 50, rt: 55 } },
    { id: 'rx-9070', model: 'Radeon RX 9070', brand: 'AMD', vram: 16, tdp: 220, price: 549, year: 2025, buyable: true, perf: { raster: 43, rt: 48 } },
    { id: 'rx-9070-gre', model: 'Radeon RX 9070 GRE', brand: 'AMD', vram: 12, tdp: 220, price: 499, year: 2025, buyable: true, perf: { raster: 36, rt: 40 } },
    { id: 'rx-9060-xt-16', model: 'Radeon RX 9060 XT 16GB', brand: 'AMD', vram: 16, tdp: 160, price: 379, year: 2025, buyable: true, perf: { raster: 26, rt: 30 } },
    { id: 'rx-9060-xt', model: 'Radeon RX 9060 XT', brand: 'AMD', vram: 8, tdp: 150, price: 329, year: 2025, buyable: true, perf: { raster: 25, rt: 29 } },
    { id: 'rx-9060', model: 'Radeon RX 9060', brand: 'AMD', vram: 8, tdp: 132, price: 279, year: 2025, buyable: true, perf: { raster: 22, rt: 25 } },

    // ---- AMD Radeon RX 7000 / 6000 / 500 ----
    { id: 'rx-7900-xtx', model: 'Radeon RX 7900 XTX', brand: 'AMD', vram: 24, tdp: 355, price: 849, year: 2022, buyable: false, perf: { raster: 48, rt: 42 } },
    { id: 'rx-7900-xt', model: 'Radeon RX 7900 XT', brand: 'AMD', vram: 20, tdp: 315, price: 649, year: 2022, buyable: false, perf: { raster: 39, rt: 34 } },
    { id: 'rx-7900-gre', model: 'Radeon RX 7900 GRE', brand: 'AMD', vram: 16, tdp: 260, price: 549, year: 2024, buyable: false, perf: { raster: 33, rt: 29 } },
    { id: 'rx-7800-xt', model: 'Radeon RX 7800 XT', brand: 'AMD', vram: 16, tdp: 263, price: 449, year: 2023, buyable: false, perf: { raster: 29, rt: 25 } },
    { id: 'rx-7700-xt', model: 'Radeon RX 7700 XT', brand: 'AMD', vram: 12, tdp: 245, price: 369, year: 2023, buyable: false, perf: { raster: 23, rt: 20 } },
    { id: 'rx-7600-xt', model: 'Radeon RX 7600 XT', brand: 'AMD', vram: 16, tdp: 190, price: 299, year: 2024, buyable: false, perf: { raster: 16.5, rt: 14 } },
    { id: 'rx-7600', model: 'Radeon RX 7600', brand: 'AMD', vram: 8, tdp: 165, price: 239, year: 2023, buyable: false, perf: { raster: 16, rt: 13.5 } },
    { id: 'rx-6800-xt', model: 'Radeon RX 6800 XT', brand: 'AMD', vram: 16, tdp: 300, price: 399, year: 2020, buyable: false, perf: { raster: 27, rt: 20 } },
    { id: 'rx-6800', model: 'Radeon RX 6800', brand: 'AMD', vram: 16, tdp: 250, price: 329, year: 2020, buyable: false, perf: { raster: 23, rt: 17 } },
    { id: 'rx-6750-xt', model: 'Radeon RX 6750 XT', brand: 'AMD', vram: 12, tdp: 250, price: 279, year: 2022, buyable: false, perf: { raster: 18, rt: 13 } },
    { id: 'rx-6700-xt', model: 'Radeon RX 6700 XT', brand: 'AMD', vram: 12, tdp: 230, price: 229, year: 2021, buyable: false, perf: { raster: 17, rt: 12 } },
    { id: 'rx-6600-xt', model: 'Radeon RX 6600 XT', brand: 'AMD', vram: 8, tdp: 160, price: 159, year: 2021, buyable: false, perf: { raster: 13, rt: 9 } },
    { id: 'rx-6600', model: 'Radeon RX 6600', brand: 'AMD', vram: 8, tdp: 132, price: 129, year: 2021, buyable: false, perf: { raster: 11, rt: 8 } },
    { id: 'rx-580', model: 'Radeon RX 580', brand: 'AMD', vram: 8, tdp: 185, price: 69, year: 2017, buyable: false, perf: { raster: 5, rt: 2 } },

    // ---- Intel Arc ----
    { id: 'arc-b580', model: 'Arc B580', brand: 'Intel', vram: 12, tdp: 190, price: 249, year: 2024, buyable: true, perf: { raster: 21, rt: 24 } },
    { id: 'arc-b570', model: 'Arc B570', brand: 'Intel', vram: 10, tdp: 150, price: 219, year: 2025, buyable: true, perf: { raster: 18, rt: 20 } },
    { id: 'arc-a770', model: 'Arc A770', brand: 'Intel', vram: 16, tdp: 225, price: 199, year: 2022, buyable: false, perf: { raster: 14.5, rt: 16 } },
    { id: 'arc-a750', model: 'Arc A750', brand: 'Intel', vram: 8, tdp: 225, price: 169, year: 2022, buyable: false, perf: { raster: 15.5, rt: 15 } }
  ];

  const ramKits = [
    { id: 'ddr5-32-6000-cl30', model: '32GB DDR5-6000 CL30 (2x16)', gen: 'DDR5', speed: 6000, capacity: 32, modules: 2, price: 429, buyable: true },
    { id: 'ddr5-32-5600-cl36', model: '32GB DDR5-5600 CL36 (2x16)', gen: 'DDR5', speed: 5600, capacity: 32, modules: 2, price: 399, buyable: true },
    { id: 'ddr5-32-6400-cl32', model: '32GB DDR5-6400 CL32 (2x16)', gen: 'DDR5', speed: 6400, capacity: 32, modules: 2, price: 489, buyable: true },
    { id: 'ddr5-16-6000-cl30', model: '16GB DDR5-6000 CL30 (2x8)', gen: 'DDR5', speed: 6000, capacity: 16, modules: 2, price: 279, buyable: true },
    { id: 'ddr5-64-6000-cl30', model: '64GB DDR5-6000 CL30 (2x32)', gen: 'DDR5', speed: 6000, capacity: 64, modules: 2, price: 913, buyable: true },
    { id: 'ddr5-64-5600-cl36', model: '64GB DDR5-5600 CL36 (2x32)', gen: 'DDR5', speed: 5600, capacity: 64, modules: 2, price: 869, buyable: true },
    { id: 'ddr5-48-6000-cl30', model: '48GB DDR5-6000 CL30 (2x24)', gen: 'DDR5', speed: 6000, capacity: 48, modules: 2, price: 640, buyable: true },
    { id: 'ddr5-96-6000-cl30', model: '96GB DDR5-6000 CL30 (2x48)', gen: 'DDR5', speed: 6000, capacity: 96, modules: 2, price: 1899, buyable: true },
    { id: 'ddr5-128-5600-cl36', model: '128GB DDR5-5600 CL36 (4x32)', gen: 'DDR5', speed: 5600, capacity: 128, modules: 4, price: 2199, buyable: true },
    { id: 'ddr4-16-3200-cl16', model: '16GB DDR4-3200 CL16 (2x8)', gen: 'DDR4', speed: 3200, capacity: 16, modules: 2, price: 105, buyable: true },
    { id: 'ddr4-32-3200-cl16', model: '32GB DDR4-3200 CL16 (2x16)', gen: 'DDR4', speed: 3200, capacity: 32, modules: 2, price: 199, buyable: true },
    { id: 'ddr4-32-3600-cl18', model: '32GB DDR4-3600 CL18 (2x16)', gen: 'DDR4', speed: 3600, capacity: 32, modules: 2, price: 229, buyable: true },
    { id: 'ddr4-64-3200-cl16', model: '64GB DDR4-3200 CL16 (2x32)', gen: 'DDR4', speed: 3200, capacity: 64, modules: 2, price: 489, buyable: true },
    { id: 'ddr4-64-3600-cl18', model: '64GB DDR4-3600 CL18 (2x32)', gen: 'DDR4', speed: 3600, capacity: 64, modules: 2, price: 529, buyable: true }
  ];

  const storage = [
    { id: 'samsung-990-pro-1', model: 'Samsung 990 PRO 1TB', kind: 'NVMe Gen4', read: 7450, capacity: 1000, price: 189, buyable: true },
    { id: 'samsung-990-pro-2', model: 'Samsung 990 PRO 2TB', kind: 'NVMe Gen4', read: 7450, capacity: 2000, price: 394, buyable: true },
    { id: 'samsung-990-pro-4', model: 'Samsung 990 PRO 4TB', kind: 'NVMe Gen4', read: 7450, capacity: 4000, price: 796, buyable: true },
    { id: 'samsung-9100-pro-2', model: 'Samsung 9100 PRO 2TB', kind: 'NVMe Gen5', read: 14800, capacity: 2000, price: 449, buyable: true },
    { id: 'wd-sn850x-1', model: 'WD Black SN850X 1TB', kind: 'NVMe Gen4', read: 7300, capacity: 1000, price: 249, buyable: true },
    { id: 'wd-sn850x-2', model: 'WD Black SN850X 2TB', kind: 'NVMe Gen4', read: 7300, capacity: 2000, price: 389, buyable: true },
    { id: 'wd-sn850x-4', model: 'WD Black SN850X 4TB', kind: 'NVMe Gen4', read: 7300, capacity: 4000, price: 699, buyable: true },
    { id: 'wd-sn8100-2', model: 'WD Black SN8100 2TB', kind: 'NVMe Gen5', read: 14900, capacity: 2000, price: 369, buyable: true },
    { id: 'wd-sn8100-4', model: 'WD Black SN8100 4TB', kind: 'NVMe Gen5', read: 14900, capacity: 4000, price: 699, buyable: true },
    { id: 'crucial-t500-1', model: 'Crucial T500 1TB', kind: 'NVMe Gen4', read: 7300, capacity: 1000, price: 199, buyable: true },
    { id: 'crucial-t500-2', model: 'Crucial T500 2TB', kind: 'NVMe Gen4', read: 7400, capacity: 2000, price: 381, buyable: true },
    { id: 'crucial-p310-2', model: 'Crucial P310 2TB', kind: 'NVMe Gen4', read: 7100, capacity: 2000, price: 309, buyable: true },
    { id: 'crucial-t705-2', model: 'Crucial T705 2TB', kind: 'NVMe Gen5', read: 14500, capacity: 2000, price: 499, buyable: true },
    { id: 'sk-p41-2', model: 'SK hynix Platinum P41 2TB', kind: 'NVMe Gen4', read: 7000, capacity: 2000, price: 339, buyable: true },
    { id: 'kingston-kc3000-2', model: 'Kingston KC3000 2TB', kind: 'NVMe Gen4', read: 7000, capacity: 2000, price: 499, buyable: true },
    { id: 'lexar-nm790-2', model: 'Lexar NM790 2TB', kind: 'NVMe Gen4', read: 7400, capacity: 2000, price: 299, buyable: true },
    { id: 'sabrent-rocket-4p-2', model: 'Sabrent Rocket 4 Plus 2TB', kind: 'NVMe Gen4', read: 7100, capacity: 2000, price: 349, buyable: true },
    { id: 'teamgroup-mp44-2', model: 'TeamGroup MP44 2TB', kind: 'NVMe Gen4', read: 7400, capacity: 2000, price: 289, buyable: true },
    { id: 'silicon-power-ud90-2', model: 'Silicon Power UD90 2TB', kind: 'NVMe Gen4', read: 5000, capacity: 2000, price: 259, buyable: true },
    { id: 'samsung-980-1', model: 'Samsung 980 1TB', kind: 'NVMe Gen3', read: 3500, capacity: 1000, price: 99, buyable: true },
    { id: 'crucial-p1-500', model: 'Crucial P1 500GB', kind: 'NVMe Gen3', read: 2000, capacity: 500, price: 49, buyable: true },
    { id: 'wd-sn570-1', model: 'WD Blue SN570 1TB', kind: 'NVMe Gen3', read: 3500, capacity: 1000, price: 119, buyable: true },
    { id: 'samsung-970-evo-plus-1', model: 'Samsung 970 EVO Plus 1TB', kind: 'NVMe Gen3', read: 3500, capacity: 1000, price: 129, buyable: true },
    { id: 'crucial-p3-1', model: 'Crucial P3 1TB', kind: 'NVMe Gen3', read: 3500, capacity: 1000, price: 109, buyable: true },
    { id: 'kingston-nv2-1', model: 'Kingston NV2 1TB', kind: 'NVMe Gen4', read: 3500, capacity: 1000, price: 99, buyable: true },
    { id: 'samsung-870-evo-1', model: 'Samsung 870 EVO 1TB', kind: 'SATA SSD', read: 560, capacity: 1000, price: 139, buyable: true },
    { id: 'samsung-870-evo-4', model: 'Samsung 870 EVO 4TB', kind: 'SATA SSD', read: 560, capacity: 4000, price: 429, buyable: true },
    { id: 'crucial-mx500-1', model: 'Crucial MX500 1TB', kind: 'SATA SSD', read: 560, capacity: 1000, price: 189, buyable: true },
    { id: 'seagate-barracuda-2', model: 'Seagate Barracuda 2TB', alias: ['ST2000DM008', 'ST2000DM008 2FR102'], kind: 'HDD', read: 190, capacity: 2000, price: 69, buyable: true },
    { id: 'seagate-barracuda-4', model: 'Seagate Barracuda 4TB', kind: 'HDD', read: 190, capacity: 4000, price: 99, buyable: true },
    { id: 'seagate-barracuda-8', model: 'Seagate Barracuda 8TB', kind: 'HDD', read: 190, capacity: 8000, price: 189, buyable: true },
    { id: 'wd-blue-4', model: 'WD Blue 4TB', kind: 'HDD', read: 180, capacity: 4000, price: 109, buyable: true },
    { id: 'wd-black-4', model: 'WD Black 4TB', kind: 'HDD', read: 200, capacity: 4000, price: 189, buyable: true },
    { id: 'seagate-ironwolf-8', model: 'Seagate IronWolf 8TB', kind: 'HDD', read: 210, capacity: 8000, price: 229, buyable: true },
    { id: 'toshiba-x300-8', model: 'Toshiba X300 8TB', kind: 'HDD', read: 200, capacity: 8000, price: 219, buyable: true }
  ];

  const psus = [
    { id: 'corsair-rm750e', model: 'Corsair RM750e', brand: 'Corsair', wattage: 750, rating: '80+ Gold', atx31: true, price: 109, buyable: true },
    { id: 'corsair-rm850e', model: 'Corsair RM850e', brand: 'Corsair', wattage: 850, rating: '80+ Gold', atx31: true, price: 129, buyable: true },
    { id: 'corsair-rm1000x', model: 'Corsair RM1000x', brand: 'Corsair', wattage: 1000, rating: '80+ Gold', atx31: true, price: 199, buyable: true },
    { id: 'corsair-sf850', model: 'Corsair SF850', brand: 'Corsair', wattage: 850, rating: '80+ Platinum', atx31: true, price: 179, buyable: true },
    { id: 'seasonic-gx850', model: 'Seasonic Focus GX-850', brand: 'Seasonic', wattage: 850, rating: '80+ Gold', atx31: true, price: 139, buyable: true },
    { id: 'seasonic-vertex-px1000', model: 'Seasonic Vertex PX-1000', brand: 'Seasonic', wattage: 1000, rating: '80+ Platinum', atx31: true, price: 229, buyable: true },
    { id: 'seasonic-prime-tx1300', model: 'Seasonic Prime TX-1300', brand: 'Seasonic', wattage: 1300, rating: '80+ Titanium', atx31: true, price: 399, buyable: true },
    { id: 'bequiet-pure13-850', model: 'be quiet! Pure Power 13 M 850W', brand: 'be quiet!', wattage: 850, rating: '80+ Gold', atx31: true, price: 129, buyable: true },
    { id: 'bequiet-dark13-1000', model: 'be quiet! Dark Power 13 1000W', brand: 'be quiet!', wattage: 1000, rating: '80+ Titanium', atx31: true, price: 249, buyable: true },
    { id: 'superflower-leadex3-850', model: 'Super Flower Leadex III 850W', brand: 'Super Flower', wattage: 850, rating: '80+ Gold', atx31: false, price: 119, buyable: true },
    { id: 'fsp-hydro-g-1000', model: 'FSP Hydro G Pro 1000W', brand: 'FSP', wattage: 1000, rating: '80+ Gold', atx31: true, price: 189, buyable: true },
    { id: 'msi-mpg-a850g', model: 'MSI MPG A850G PCIE5', brand: 'MSI', wattage: 850, rating: '80+ Gold', atx31: true, price: 139, buyable: true },
    { id: 'asus-rog-strix-1000p', model: 'ASUS ROG Strix 1000W Platinum', brand: 'ASUS', wattage: 1000, rating: '80+ Platinum', atx31: true, price: 279, buyable: true },
    { id: 'tt-toughpower-gf3-850', model: 'Thermaltake Toughpower GF3 850W', brand: 'Thermaltake', wattage: 850, rating: '80+ Gold', atx31: true, price: 129, buyable: true },
    { id: 'coolermaster-mwe850', model: 'Cooler Master MWE Gold 850 V3', brand: 'Cooler Master', wattage: 850, rating: '80+ Gold', atx31: true, price: 109, buyable: true },
    { id: 'nzxt-c850', model: 'NZXT C850 Gold', brand: 'NZXT', wattage: 850, rating: '80+ Gold', atx31: true, price: 129, buyable: true },
    { id: 'lianli-edge-1000', model: 'Lian Li Edge 1000W', brand: 'Lian Li', wattage: 1000, rating: '80+ Platinum', atx31: true, price: 189, buyable: true },
    { id: 'evga-600-br', model: 'EVGA 600 BR', brand: 'EVGA', wattage: 600, rating: '80+ Bronze', atx31: false, price: 59, buyable: false },
    { id: 'corsair-cx550m', model: 'Corsair CX550M', brand: 'Corsair', wattage: 550, rating: '80+ Bronze', atx31: false, price: 69, buyable: false },
    { id: 'seasonic-s12iii-650', model: 'Seasonic S12III 650', brand: 'Seasonic', wattage: 650, rating: '80+ Bronze', atx31: false, price: 79, buyable: false },
    { id: 'tt-smart-600', model: 'Thermaltake Smart 600W', brand: 'Thermaltake', wattage: 600, rating: '80+ White', atx31: false, price: 49, buyable: false },
    { id: 'bequiet-syspower9-600', model: 'be quiet! System Power 9 600W', brand: 'be quiet!', wattage: 600, rating: '80+ Bronze', atx31: false, price: 69, buyable: false }
  ];

  const profiles = {
    balanced: {
      label: 'Balanced',
      short: 'Balanced',
      desc: 'A general-purpose mix for gaming and everyday work.',
      detail: 'A general-purpose mix for gaming and everyday work. The planner spends where the performance gain is largest.',
      weights: { cpu: 0.30, gpu: 0.38, ram: 0.14, storage: 0.10, psu: 0.08 },
      rt: 0.25, mt: 0.45, ramNeed: 32
    },
    fidelity: {
      label: 'Visual fidelity',
      short: 'Visual fidelity',
      desc: 'Prioritizes the GPU for high settings and ray tracing.',
      detail: 'Most of the budget goes to the GPU for high settings, high resolution and ray tracing. This is image quality in games, not 3D rendering.',
      weights: { cpu: 0.18, gpu: 0.56, ram: 0.11, storage: 0.07, psu: 0.08 },
      rt: 0.40, mt: 0.30, ramNeed: 32
    },
    competitive: {
      label: 'Competitive gaming',
      short: 'Competitive',
      desc: 'Prioritizes CPU speed and frame rate for 1080p and 1440p.',
      detail: 'CPU speed and frame rate come first for 1080p and 1440p. Ray tracing and maximum visual settings matter less.',
      weights: { cpu: 0.34, gpu: 0.38, ram: 0.12, storage: 0.08, psu: 0.08 },
      rt: 0.15, mt: 0.40, ramNeed: 32
    },
    creation: {
      label: 'Content creation',
      short: 'Creation',
      desc: 'Prioritizes CPU cores and memory for editing and streaming.',
      detail: 'CPU cores and memory come first for photo and video editing, streaming and heavy multitasking.',
      weights: { cpu: 0.38, gpu: 0.28, ram: 0.16, storage: 0.10, psu: 0.08 },
      rt: 0.20, mt: 0.65, ramNeed: 64
    },
    render: {
      label: '3D & rendering',
      short: '3D / render',
      desc: 'Prioritizes CPU cores and GPU compute for offline rendering.',
      detail: 'CPU cores and GPU compute come first for Blender, CAD and offline renders. The goal is shorter render times, not better game settings.',
      weights: { cpu: 0.33, gpu: 0.38, ram: 0.14, storage: 0.07, psu: 0.08 },
      rt: 0.30, mt: 0.60, ramNeed: 64
    },
    aiml: {
      label: 'AI & ML',
      short: 'AI / ML',
      desc: 'Prioritizes GPU compute and VRAM for local models.',
      detail: 'GPU compute and VRAM come first for local models, then system memory.',
      weights: { cpu: 0.10, gpu: 0.48, ram: 0.26, storage: 0.08, psu: 0.08 },
      rt: 0.10, mt: 0.45, ramNeed: 64, vram: true
    },
    everyday: {
      label: 'Everyday use',
      short: 'Everyday',
      desc: 'Prioritizes cost, storage speed and responsiveness.',
      detail: 'Cost, storage speed and general responsiveness come first for browsing, office work, media and light gaming.',
      weights: { cpu: 0.30, gpu: 0.10, ram: 0.24, storage: 0.28, psu: 0.08 },
      rt: 0.10, mt: 0.50, ramNeed: 24
    }
  };

  const priceData = window.PCPriceData;
  const allParts = cpus.concat(gpus, ramKits, storage, psus);
  if (priceData && priceData.prices) {
    allParts.forEach((item) => {
      const price = priceData.prices[item.id];
      if (Number.isFinite(price)) {
        item.price = price;
        item.priceChecked = true;
      }
    });
  }

  const checked = priceData && priceData.checked;
  const priceDate = checked
    ? new Date(checked + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : 'November 2026';
  const priceShort = checked
    ? new Date(checked + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    : 'November 2026';

  return {
    cpus,
    gpus,
    ramKits,
    storage,
    psus,
    profiles,
    meta: {
      updated: priceDate,
      priceChecked: priceDate,
      priceCheckedShort: priceShort,
      priceSource: priceData ? priceData.source : 'US retail listings',
      priceSourceUrl: priceData ? priceData.sourceUrl : '',
      currency: 'USD',
      note: 'GPU, CPU and memory prices are checked Newegg listings for ' + priceDate + '. Storage and PSU figures are estimates. Prices change often, so open a listing before buying.',
      sockets: {
        AM5: 'AMD AM5',
        AM4: 'AMD AM4',
        LGA1851: 'Intel LGA1851',
        LGA1700: 'Intel LGA1700',
        LGA1200: 'Intel LGA1200',
        LGA1151: 'Intel LGA1151'
      }
    }
  };
})();
