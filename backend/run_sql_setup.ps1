# PowerShell script to run MySQL schema setup
# This script connects to MySQL and runs the schema.sql file

$mysqlPath = "mysql"  # Change this if mysql is not in PATH
$mysqlHost = "127.0.0.1"
$port = "3306"
$user = "root"
$password = "Root@1234"
$database = "location_sharing"
$schemaFile = ".\database\schema.sql"

Write-Host "Setting up MySQL database..." -ForegroundColor Green

# Check if schema file exists
if (-not (Test-Path $schemaFile)) {
    Write-Host "Error: Schema file not found at $schemaFile" -ForegroundColor Red
    exit 1
}

# Create database first (if it doesn't exist)
$createDbQuery = "CREATE DATABASE IF NOT EXISTS $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Write-Host "Creating database (if not exists)..." -ForegroundColor Yellow
& $mysqlPath -h$mysqlHost -P$port -u$user -p$password -e $createDbQuery

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create database. Make sure MySQL is running and credentials are correct." -ForegroundColor Red
    exit 1
}

Write-Host "Database created successfully!" -ForegroundColor Green

# Run schema file
Write-Host "Running schema file..." -ForegroundColor Yellow

# Use Get-Content to pipe SQL file content to mysql
Get-Content $schemaFile | & $mysqlPath -h$mysqlHost -P$port -u$user -p$password $database

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to run schema file." -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. MySQL server is running" -ForegroundColor Yellow
    Write-Host "  2. Credentials are correct" -ForegroundColor Yellow
    Write-Host "  3. MySQL command line tool is in PATH" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Alternatively, run the SQL script manually in MySQL Workbench:" -ForegroundColor Cyan
    Write-Host "  File: $((Resolve-Path $schemaFile).Path)" -ForegroundColor Cyan
    exit 1
}

Write-Host "Schema setup completed successfully!" -ForegroundColor Green
Write-Host "Database: $database" -ForegroundColor Cyan
Write-Host "You can now start the backend server." -ForegroundColor Cyan

