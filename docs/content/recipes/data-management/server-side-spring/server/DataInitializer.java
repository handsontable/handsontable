package com.example.products;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds the H2 database with 55 product rows on application startup.
 *
 * The guard `if (repository.count() == 0)` prevents duplicate inserts if
 * the bean is somehow called more than once during testing.
 */
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedDatabase(ProductRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.saveAll(List.of(
                    product("Laptop Pro 15",          "SKU-0001", "Electronics",  new BigDecimal("1299.99"), 45),
                    product("Wireless Keyboard",       "SKU-0002", "Accessories",  new BigDecimal("89.99"),   120),
                    product("Ergonomic Mouse",         "SKU-0003", "Accessories",  new BigDecimal("59.99"),   85),
                    product("4K Monitor 27\"",         "SKU-0004", "Electronics",  new BigDecimal("549.00"),  30),
                    product("USB-C Hub 7-in-1",        "SKU-0005", "Accessories",  new BigDecimal("49.99"),   200),
                    product("Mechanical Keyboard",     "SKU-0006", "Accessories",  new BigDecimal("149.00"),  65),
                    product("Webcam HD 1080p",         "SKU-0007", "Electronics",  new BigDecimal("79.99"),   95),
                    product("Desk Lamp LED",           "SKU-0008", "Office",       new BigDecimal("39.99"),   150),
                    product("Standing Desk Mat",       "SKU-0009", "Office",       new BigDecimal("29.99"),   180),
                    product("Cable Management Kit",    "SKU-0010", "Accessories",  new BigDecimal("19.99"),   300),
                    product("Noise-Cancelling Headset","SKU-0011", "Electronics",  new BigDecimal("199.99"),  55),
                    product("Laptop Stand Aluminium",  "SKU-0012", "Accessories",  new BigDecimal("69.99"),   110),
                    product("Smart Plug 4-Pack",       "SKU-0013", "Smart Home",   new BigDecimal("34.99"),   250),
                    product("Portable SSD 1TB",        "SKU-0014", "Storage",      new BigDecimal("119.99"),  75),
                    product("Wireless Charger Pad",    "SKU-0015", "Accessories",  new BigDecimal("29.99"),   160),
                    product("Screen Privacy Filter",   "SKU-0016", "Accessories",  new BigDecimal("44.99"),   90),
                    product("USB Microphone",          "SKU-0017", "Electronics",  new BigDecimal("89.99"),   40),
                    product("Laptop Sleeve 15\"",      "SKU-0018", "Accessories",  new BigDecimal("24.99"),   200),
                    product("Dual Monitor Arm",        "SKU-0019", "Office",       new BigDecimal("129.99"),  35),
                    product("Keyboard Wrist Rest",     "SKU-0020", "Accessories",  new BigDecimal("17.99"),   220),
                    product("External Numpad",         "SKU-0021", "Accessories",  new BigDecimal("32.99"),   115),
                    product("HDMI 2.1 Cable 2m",       "SKU-0022", "Cables",       new BigDecimal("14.99"),   400),
                    product("USB-A to USB-C Adapter",  "SKU-0023", "Cables",       new BigDecimal("9.99"),    500),
                    product("Thunderbolt 4 Dock",      "SKU-0024", "Electronics",  new BigDecimal("279.00"),  20),
                    product("Bluetooth Speaker",       "SKU-0025", "Electronics",  new BigDecimal("59.99"),   85),
                    product("Fingerprint Reader",      "SKU-0026", "Security",     new BigDecimal("49.99"),   60),
                    product("Document Scanner",        "SKU-0027", "Office",       new BigDecimal("189.00"),  25),
                    product("Label Printer",           "SKU-0028", "Office",       new BigDecimal("99.00"),   45),
                    product("Desk Organiser Set",      "SKU-0029", "Office",       new BigDecimal("24.99"),   175),
                    product("Monitor Calibrator",      "SKU-0030", "Electronics",  new BigDecimal("139.99"),  18),
                    product("Ergonomic Chair Cushion", "SKU-0031", "Office",       new BigDecimal("49.99"),   130),
                    product("Green Screen 180x200",    "SKU-0032", "Electronics",  new BigDecimal("74.99"),   40),
                    product("Ring Light 18\"",         "SKU-0033", "Electronics",  new BigDecimal("59.99"),   55),
                    product("Pen Tablet Small",        "SKU-0034", "Electronics",  new BigDecimal("79.99"),   70),
                    product("Drawing Glove 2-Pack",    "SKU-0035", "Accessories",  new BigDecimal("7.99"),    350),
                    product("SD Card 256GB",           "SKU-0036", "Storage",      new BigDecimal("34.99"),   300),
                    product("MicroSD 128GB + Adapter", "SKU-0037", "Storage",      new BigDecimal("19.99"),   400),
                    product("NAS Drive 4TB",           "SKU-0038", "Storage",      new BigDecimal("99.99"),   22),
                    product("USB Flash Drive 64GB",    "SKU-0039", "Storage",      new BigDecimal("12.99"),   500),
                    product("Fibre Patch Cable 1m",    "SKU-0040", "Cables",       new BigDecimal("8.99"),    600),
                    product("8-Port Network Switch",   "SKU-0041", "Networking",   new BigDecimal("39.99"),   80),
                    product("Wi-Fi 6 Router",          "SKU-0042", "Networking",   new BigDecimal("149.99"),  35),
                    product("Powerline Adapter Kit",   "SKU-0043", "Networking",   new BigDecimal("59.99"),   60),
                    product("PoE Injector 30W",        "SKU-0044", "Networking",   new BigDecimal("24.99"),   90),
                    product("IP Camera Outdoor",       "SKU-0045", "Security",     new BigDecimal("89.99"),   45),
                    product("Smart Doorbell",          "SKU-0046", "Smart Home",   new BigDecimal("129.99"),  30),
                    product("Motion Sensor 3-Pack",    "SKU-0047", "Smart Home",   new BigDecimal("39.99"),   110),
                    product("Smart Light Bulb E27",    "SKU-0048", "Smart Home",   new BigDecimal("14.99"),   400),
                    product("Smart Power Strip",       "SKU-0049", "Smart Home",   new BigDecimal("44.99"),   85),
                    product("CO2 Air Quality Monitor", "SKU-0050", "Smart Home",   new BigDecimal("69.99"),   50),
                    product("Laptop Pro 16",           "SKU-0051", "Electronics",  new BigDecimal("1499.99"), 20),
                    product("Tablet Stand Adjustable", "SKU-0052", "Accessories",  new BigDecimal("22.99"),   140),
                    product("Laptop Cooling Pad",      "SKU-0053", "Accessories",  new BigDecimal("35.99"),   100),
                    product("Privacy Webcam Cover",    "SKU-0054", "Accessories",  new BigDecimal("4.99"),    700),
                    product("Anti-Glare Screen Wipes", "SKU-0055", "Accessories",  new BigDecimal("6.99"),    800)
                ));
            }
        };
    }

    private Product product(String name, String sku, String category, BigDecimal price, int stock) {
        Product p = new Product();
        p.setName(name);
        p.setSku(sku);
        p.setCategory(category);
        p.setPrice(price);
        p.setStock(stock);
        return p;
    }
}
