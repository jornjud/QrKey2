// ตัวอักษรที่อนุญาตในการเข้ารหัส
const ALLOWED_CHARS = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ' +
                      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
                      '!@#$%^&*()_+-=[]{}|;:,./<>?';

function generateShortSeed() {
    return Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
}

function createPRNG(seed, keyword) {
    const combined = seed + keyword;
    let state = 0;
    for (let i = 0; i < combined.length; i++) {
        state = ((state << 5) - state + combined.charCodeAt(i)) | 0;
    }
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x80000000;
    };
}

function encodeThaiEng(text, seed, keyword) {
    if (!keyword) {
        return text;
    }

    const prng = createPRNG(seed, keyword);
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const index = ALLOWED_CHARS.indexOf(char);
        if (index !== -1) {
            const shift = Math.floor(prng() * ALLOWED_CHARS.length);
            const newIndex = (index + shift) % ALLOWED_CHARS.length;
            result += ALLOWED_CHARS[newIndex];
        } else {
            result += char;
        }
    }
    return result;
}

function decodeThaiEng(encodedText, seed, keyword) {
    if (!keyword) {
        return encodedText;
    }

    const prng = createPRNG(seed, keyword);
    let result = '';
    for (let i = 0; i < encodedText.length; i++) {
        const char = encodedText[i];
        const index = ALLOWED_CHARS.indexOf(char);
        if (index !== -1) {
            const shift = Math.floor(prng() * ALLOWED_CHARS.length);
            const newIndex = (index - shift + ALLOWED_CHARS.length) % ALLOWED_CHARS.length;
            result += ALLOWED_CHARS[newIndex];
        } else {
            result += char;
        }
    }
    return result;
}

function encrypt(text, keyword) {
    if (!keyword) {
        return text;
    }
    const seed = generateShortSeed();
    return seed + encodeThaiEng(text, seed, keyword);
}

function decrypt(encodedText, keyword) {
    if (!keyword) {
        return encodedText.slice(4);
    }
    const seed = encodedText.slice(0, 4);
    const text = encodedText.slice(4);
    return decodeThaiEng(text, seed, keyword);
}

function generateQRCode(text) {
    const encodedText = encodeURIComponent(text);
    const qrCodeText = `https://github.com/jornjud/QrKey2/decoder.html?text=${encodedText}`;
    const qrcode = document.getElementById('qrcode');
    if (qrcode) {
        qrcode.innerHTML = "";  // ล้าง QR Code เก่า
        new QRCode(qrcode, {
            text: qrCodeText,
            width: 300,
            height: 300,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        const linkElement = document.getElementById('qrcode-link');
        if (linkElement) {
            linkElement.innerHTML = `<a href="${qrCodeText}" target="_blank">${qrCodeText}</a>`;
        }
    }
}

function updateTranslation() {
    const sourceText = document.getElementById("sourceText");
    const keyword = document.getElementById("keyword");
    if (sourceText && keyword) {
        const targetText = encrypt(sourceText.value, keyword.value);
        generateQRCode(targetText);
    }
}

function saveQRCode() {
    const qrcode = document.getElementById('qrcode');
    if (qrcode) {
        const img = qrcode.querySelector('img');
        if (img) {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = img.src;
            link.click();
        }
    }
}

function shareQRCode() {
    const qrcodeLink = document.getElementById('qrcode-link');
    if (qrcodeLink) {
        const link = qrcodeLink.textContent;
        if (navigator.share) {
            navigator.share({
                title: 'SQRC QR Code',
                text: 'Check out this SQRC QR Code',
                url: link
            }).catch(console.error);
        } else {
            alert('Web Share API is not supported in your browser. You can manually copy the link: ' + link);
        }
    }
}

function copyToClipboard() {
    const qrcodeLink = document.getElementById('qrcode-link');
    if (qrcodeLink) {
        const link = qrcodeLink.textContent;
        navigator.clipboard.writeText(link).then(() => {
            alert('คัดลอกลิงก์แล้ว!');
        }).catch(err => {
            console.error('ไม่สามารถคัดลอกข้อความ: ', err);
        });
    }
}

function decodeText() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedText = urlParams.get('text');
    const keywordElement = document.getElementById('keyword');
    const decodedContentElement = document.getElementById('decodedContent');
    
    if (keywordElement && decodedContentElement) {
        const keyword = keywordElement.value;
        
        if (encodedText) {
            const decodedText = decrypt(encodedText, keyword);
            decodedContentElement.innerHTML = `<strong>ข้อความที่ถอดรหัสแล้ว:</strong><br>${decodedText}`;
        } else {
            alert('ไม่พบข้อความที่เข้ารหัส');
        }
    }
}

window.onload = function() {
    // สำหรับ index.html
    const convertButton = document.getElementById('convertButton');
    if (convertButton) {
        convertButton.addEventListener('click', updateTranslation);
    }

    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', saveQRCode);
    }

    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.addEventListener('click', shareQRCode);
    }

    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', copyToClipboard);
    }

    // สำหรับ decoder.html
    const decodeButton = document.getElementById('decodeButton');
    if (decodeButton) {
        decodeButton.addEventListener('click', decodeText);
    }

    const keywordElement = document.getElementById('keyword');
    if (keywordElement) {
        keywordElement.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                if (decodeButton) {
                    decodeText();
                } else {
                    updateTranslation();
                }
            }
        });
    }

    // ถอดรหัสอัตโนมัติเมื่อโหลดหน้าถ้าไม่มี keyword (สำหรับ decoder.html)
    const urlParams = new URLSearchParams(window.location.search);
    const encodedText = urlParams.get('text');
    const decodedContentElement = document.getElementById('decodedContent');
    if (encodedText && decodedContentElement) {
        const decodedText = decrypt(encodedText, '');
        decodedContentElement.innerHTML = `<strong>ข้อความที่ถอดรหัสแล้ว:</strong><br>${decodedText}`;
    }
};
