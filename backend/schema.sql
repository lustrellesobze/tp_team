CREATE DATABASE IF NOT EXISTS edusmart_cm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edusmart_cm;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'teacher', 'principal') NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  level VARCHAR(50),
  capacity INT DEFAULT 40
);

CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  building VARCHAR(100),
  capacity INT DEFAULT 40
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricule VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  gender ENUM('M', 'F') NOT NULL,
  class_id INT,
  status ENUM('active', 'transferred', 'radiated') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject VARCHAR(50) NOT NULL,
  value DECIMAL(4, 2) NOT NULL,
  coefficient INT NOT NULL DEFAULT 1,
  teacher_id INT,
  term VARCHAR(10) NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  from_class_id INT,
  to_class_id INT,
  reason TEXT,
  transferred_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (from_class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (to_class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (transferred_by) REFERENCES users(id) ON DELETE SET NULL
);