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
        return encodedText;  // ไม่ตัด 4 ตัวอักษรแรก ถ้าไม่มีคีย์เวิร์ด
    }
    const seed = encodedText.slice(0, 4);
    const text = encodedText.slice(4);
    return decodeThaiEng(text, seed, keyword);
}

// ฟังก์ชันสำหรับการอัพโหลดรูปภาพและแสดงใน QR Code
document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];  // รับไฟล์จากผู้ใช้งาน
    const reader = new FileReader();

    reader.onload = function(e) {
        const imgElement = document.getElementById('uploadedImage');
        imgElement.src = e.target.result;  // ตั้งค่ารูปภาพที่อัพโหลด
        imgElement.style.display = 'block';  // แสดงรูปภาพ
        imgElement.style.width = '50px';  // ปรับขนาดของรูปภาพ
        imgElement.style.height = '50px';  // ปรับขนาดของรูปภาพ
    };

    if (file) {
        reader.readAsDataURL(file);  // อ่านไฟล์ภาพและแปลงเป็น data URL
    }
});

function generateQRCode(text) {
    const encodedText = encodeURIComponent(text);
    const qrCodeText = `https://jornjud.github.io/QrKey2/decoder.html?text=${encodedText}`;
    const qrcode = document.getElementById('qrcode');
    if (qrcode) {
        qrcode.innerHTML = "";  // Clear old QR Code
        
        // Create a wrapper div for positioning
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '300px';
        wrapper.style.height = '300px';
        
        // Create the QR code
        new QRCode(wrapper, {
            text: qrCodeText,
            width: 300,
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Add orange border
        wrapper.style.border = '10px solid #FFA500';
        wrapper.style.boxSizing = 'border-box';
        
        // Add uploaded image to the center
        const uploadedImage = document.getElementById('uploadedImage');
        if (uploadedImage.src) {
            const centerImage = document.createElement('img');
            centerImage.src = uploadedImage.src;
            centerImage.style.position = 'absolute';
            centerImage.style.top = '50%';
            centerImage.style.left = '50%';
            centerImage.style.transform = 'translate(-50%, -50%)';
            centerImage.style.width = '50px';
            centerImage.style.height = '50px';
            centerImage.style.borderRadius = '50%';
            wrapper.appendChild(centerImage);
        }
        
        qrcode.appendChild(wrapper);

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
        html2canvas(qrcode).then(canvas => {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    }
}

function shareQRCode() {
    const qrcode = document.getElementById('qrcode');
    if (qrcode) {
        html2canvas(qrcode).then(canvas => {
            canvas.toBlob(blob => {
                const file = new File([blob], "qrcode.png", { type: "image/png" });
                if (navigator.share) {
                    navigator.share({
                        title: 'SQRC QR Code',
                        text: 'Check out this SQRC QR Code',
                        files: [file]
                    }).catch(console.error);
                } else {
                    alert('Web Share API is not supported in your browser. You can save the QR code and share it manually.');
                }
            });
        });
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
            decodedContentElement.innerHTML = `<strong>ข้อความที่ถอดรหัสแล้ว/ข้อความที่ต้องใส่คีย์เวิร์ดก่อน:</strong><br>${decodedText}`;
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
        decodedContentElement.innerHTML = `<strong>ข้อความที่ถอดรหัสแล้ว/ข้อความที่ต้องใส่คีย์เวิร์ดก่อน:</strong><br>${decodedText}`;
    }
};