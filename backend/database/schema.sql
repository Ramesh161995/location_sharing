-- Location Sharing App Database Schema
-- MySQL Database: location_sharing
-- Run this script in MySQL Workbench or command line

CREATE DATABASE IF NOT EXISTS location_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE location_sharing;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    avatar TEXT NULL,
    -- Settings (stored as JSON)
    privacy_level VARCHAR(20) DEFAULT 'private',
    share_location BOOLEAN DEFAULT FALSE,
    notifications BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    -- Subscription
    subscription_plan VARCHAR(20) DEFAULT 'free',
    subscription_expires_at DATETIME NULL,
    subscription_features JSON NULL,
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen DATETIME NULL,
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NULL,
    contact_avatar TEXT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    can_share_location BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_contact (user_id, contact_phone),
    INDEX idx_user_id (user_id),
    INDEX idx_contact_phone (contact_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(10, 2) NULL,
    accuracy DECIMAL(10, 2) NULL,
    speed DECIMAL(10, 2) NULL,
    heading DECIMAL(5, 2) NULL,
    timestamp DATETIME NOT NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    -- Sharing settings
    is_shared BOOLEAN DEFAULT FALSE,
    expires_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_expires_at (expires_at),
    INDEX idx_location (latitude, longitude),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Location Sharing (many-to-many: locations to contacts)
CREATE TABLE IF NOT EXISTS location_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    shared_with_user_id INT NOT NULL,
    permission_level VARCHAR(20) DEFAULT 'view', -- view, track, full
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_location_share (location_id, shared_with_user_id),
    INDEX idx_location_id (location_id),
    INDEX idx_shared_with (shared_with_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Groups Table
CREATE TABLE IF NOT EXISTS `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_by_user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Group Members (many-to-many: groups to users)
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(20) DEFAULT 'member', -- admin, member
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_member (group_id, user_id),
    INDEX idx_group_id (group_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Sessions (temporary table for OTP verification)
CREATE TABLE IF NOT EXISTS otp_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT DEFAULT 0,
    is_used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens (for JWT refresh)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

