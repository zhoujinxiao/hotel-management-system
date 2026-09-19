CREATE DATABASE IF NOT EXISTS hotel_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'hotel'@'localhost' IDENTIFIED BY 'hotel_dev_password';
ALTER USER 'hotel'@'localhost' IDENTIFIED BY 'hotel_dev_password';
GRANT ALL PRIVILEGES ON hotel_management.* TO 'hotel'@'localhost';
FLUSH PRIVILEGES;
