const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ana dizini belirle
const directoryPath = process.env.GITHUB_WORKSPACE || path.resolve('.');

// Ana dizindeki klasörleri listele
fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
    if (err) {
        console.error('Hata:', err);
        return;
    }
    files.forEach(file => {
        if (file.isDirectory()) {
            console.log(file.name); // Sadece klasör isimlerini yazdır
        }
    });
});

const diffOutput = execSync('git diff HEAD^ HEAD --unified=0').toString();

// Değişiklikleri işle
const changes = [];

// Basit bir regex ile değişiklikleri bul
const diffLines = diffOutput.split('\n');
diffLines.forEach(line => {
    if (line.startsWith('+++')) {
        // Yeni dosya adını al
        const fileName = line.split(' ')[1].replace('b/', '');
        changes.push({ file: fileName, lines: [] });
    } else if (line.startsWith('+') && !line.startsWith('++')) {
        // Değişiklik yapılan satırları al
        changes[changes.length - 1].lines.push(line.substring(1));
    }
});

// Değişiklikleri yazdır
console.log(JSON.stringify(changes, null, 2));