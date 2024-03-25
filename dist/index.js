/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 81:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);
const { execSync } = __nccwpck_require__(81);

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

console.log(JSON.stringify(changes, null, 2));
})();

module.exports = __webpack_exports__;
/******/ })()
;