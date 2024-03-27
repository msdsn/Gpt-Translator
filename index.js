const fs = require('fs').promises; // fs.promises API'si
const path = require('path');
const { execSync } = require('child_process');

// Ana dizini belirle
const directoryPath = process.env.GITHUB_WORKSPACE || path.resolve('.');

async function listUnprocessedDirectories() {
    try {
        const files = await fs.readdir(directoryPath, { withFileTypes: true });
        const directories = files
            .filter(file => file.isDirectory() && !file.name.startsWith('.'))
            .map(dir => dir.name);

        const groupedDirectories = directories.reduce((acc, dir) => {
            const baseName = dir.replace(/(_en|_de)$/, ''); // Dil uzantısını kaldır
            if (!acc[baseName]) {
                acc[baseName] = [];
            }
            acc[baseName].push(dir);
            return acc;
        }, {});

        const unprocessedDirectories = Object.keys(groupedDirectories).filter(baseName => {
            const variants = groupedDirectories[baseName];
            return variants.length === 1 && !variants[0].endsWith('_en') && !variants[0].endsWith('_de');
        });

        console.log('İşleme alınacak klasörler:', unprocessedDirectories);
        // return unprocessedDirectories and groupedDirectories at the same time
        return { unprocessedDirectories, groupedDirectories };
        
    } catch (err) {
        console.error('Hata:', err);
    }
}

async function translateChanges(changes, unprocessedDirectories, groupedDirectories) {
    for (const change of changes) {
        const originalFilePath = path.join(process.env.GITHUB_WORKSPACE || '.', change.file);
        const originalFileContent = await fs.readFile(originalFilePath, 'utf8');
        const originalFileLines = originalFileContent.split('\n');

        // Klasör ve dosya isimlerini elde et
        const directoryPath = path.dirname(change.file);
        const directoryName = path.basename(directoryPath);
        const fileName = path.basename(change.file);

        // Eğer klasör unprocessedDirectories içinde değilse ve _en veya _de ile bitmiyorsa
        if (!directoryName.match(/_(en|de)$/) && !unprocessedDirectories.includes(directoryName)) {
            // Hedef (_en) klasörünü belirle ve oluştur
            const targetEnDirectory = path.join(directoryPath, '..', `${directoryName}_en`);
            await fs.mkdir(targetEnDirectory, { recursive: true });

            const targetEnFilePath = path.join(targetEnDirectory, fileName);
            let targetEnFileContent;

            try {
                // Eğer hedef dosya zaten varsa, içeriğini oku
                targetEnFileContent = await fs.readFile(targetEnFilePath, 'utf8');
            } catch {
                // Hedef dosya yoksa, orijinal dosyanın içeriğini kullan
                targetEnFileContent = originalFileContent;
            }

            const targetEnFileLines = targetEnFileContent.split('\n');

            // Değişiklik yapılan satırları çevir ve hedef dosyaya yaz
            for (const lineIndex of change.lines.map(Number)) {
                if (lineIndex < targetEnFileLines.length) {
                    const translatedLine = await translate(originalFileLines[lineIndex]);
                    targetEnFileLines[lineIndex] = translatedLine;
                }
            }

            await fs.writeFile(targetEnFilePath, targetEnFileLines.join('\n'));
            console.log(`${targetEnFilePath} dosyası güncellendi.`);
        }
    }
}
function getChangesFromDiff() {
    try {
        const diffOutput = execSync('git diff HEAD^ HEAD --unified=0').toString();
        const changes = [];
        const diffLines = diffOutput.split('\n');
        let currentFilePath;

        diffLines.forEach(line => {
            if (line.startsWith('+++ b/')) {
                // Dosyanın tam yolunu al
                currentFilePath = line.substring('+++ b/'.length);
            } else if (line.startsWith('+') && !line.startsWith('++')) {
                // Değişiklik yapılan satırları al
                if (currentFilePath) {
                    if (!changes.some(change => change.file === currentFilePath)) {
                        changes.push({ file: currentFilePath, lines: [] });
                    }
                    changes.find(change => change.file === currentFilePath).lines.push(line.substring(1));
                }
            }
        });

        return changes;
    } catch (error) {
        console.error('Diff alınırken bir hata oluştu:', error);
        return [];
    }
}

function getChangesFromDiff_v1() {
    try {
        const diffOutput = execSync('git diff HEAD^ HEAD --unified=0').toString();

        const changes = [];
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

        return changes;
    } catch (error) {
        console.error('Diff alınırken bir hata oluştu:', error);
        return []; // Hata durumunda boş dizi dön
    }
}

// Basit bir çeviri fonksiyonu simülasyonu
async function translateFile(text) {
    // Bu kısımda gerçek bir çeviri API'si kullanılabilir
    return `Translated: ${text}`;
}

async function processDirectory(directory) {
    const directoryPath = path.join(process.env.GITHUB_WORKSPACE || '.', directory);
    const files = await fs.readdir(directoryPath);

    for (const file of files) {
        if (file.endsWith('.md')) {
            const filePath = path.join(directoryPath, file);
            const content = await fs.readFile(filePath, 'utf-8');

            // Dosya içeriğini çevir
            const translatedContent = await translateFile(content);

            // Hedef klasörü belirle ve oluştur
            const targetDirectoryPath = path.join(directoryPath, '..', `${directory}_en`);
            await fs.mkdir(targetDirectoryPath, { recursive: true });

            // Çeviri sonucunu yeni dosyada kaydet
            const targetFilePath = path.join(targetDirectoryPath, file);
            await fs.writeFile(targetFilePath, translatedContent);
            console.log(`${file} dosyası çevrildi ve ${targetDirectoryPath} içine kaydedildi.`);
        }
    }
}

async function processDirectories(directories) {
    for (const dir of directories) {
        console.log(`${dir} klasörü işleniyor...`);
        await processDirectory(dir);
    }
}

async function processDirectories() {
    const { unprocessedDirectories, groupedDirectories } = await listUnprocessedDirectories();
    await processDirectories(unprocessedDirectories);
    const changes = getChangesFromDiff();
    console.log(JSON.stringify(changes, null, 2));
    await translateChanges(changes, unprocessedDirectories, groupedDirectories);
}

processDirectories().catch(console.error);

