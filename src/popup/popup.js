// Hằng số cố định để dễ thay đổi sau này
const GOOGLE_TRANSLATE_API = "https://translate.googleapis.com/translate_a/single";
const MAX_TEXT_LENGTH = 4000; // Giới hạn ký tự cho mỗi yêu cầu API
const DETECT_LANGUAGE_LIMIT = 100; // Số ký tự tối đa để phát hiện ngôn ngữ

// Bộ nhớ đệm lưu trữ các bản dịch đã thực hiện (tối ưu hiệu suất)
const translationCache = new Map();

/**
 * Dịch văn bản bằng Google Translate API, hỗ trợ cả văn bản dài
 * @param {string} text - Văn bản cần dịch
 * @param {string} targetLanguage - Ngôn ngữ đích (ví dụ: 'vi', 'en')
 * @param {string} sourceLanguage - Ngôn ngữ nguồn (ví dụ: 'en', 'auto')
 * @returns {Promise<string>} - Văn bản đã dịch
 */
async function translateText(text, targetLanguage, sourceLanguage = "auto") {
    const cacheKey = `${text}-${sourceLanguage}-${targetLanguage}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    // Nếu không có text, trả về rỗng
    if (!text.trim()) return "";

    // Dịch văn bản ngắn (< MAX_TEXT_LENGTH)
    if (text.length <= MAX_TEXT_LENGTH) {
        try {
            const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;

            const response = await fetch(url);
            if (!response.ok) {
                console.error("API response not OK:", response.status, response.statusText);
                throw new Error(`API không phản hồi: ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data[0]) {
                console.error("Invalid data structure:", data);
                throw new Error("Dữ liệu trả về không hợp lệ");
            }

            const translatedText = data[0]
                .filter((item) => item && item[0])
                .map((item) => item[0])
                .join("");

            translationCache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error("Lỗi khi dịch:", error);
            return "Lỗi dịch thuật: " + error.message;
        }
    }

    // Dịch văn bản dài bằng cách chia nhỏ
    try {
        const chunks = [];
        for (let i = 0; i < text.length; i += MAX_TEXT_LENGTH) {
            chunks.push(text.slice(i, i + MAX_TEXT_LENGTH));
        }

        const translatedChunks = await Promise.all(
            chunks.map(async (chunk, index) => {
                const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(chunk)}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`API không phản hồi cho phần ${index + 1}`);
                const data = await response.json();

                if (!data || !data[0]) {
                    throw new Error(`Dữ liệu trả về không hợp lệ cho phần ${index + 1}`);
                }

                return data[0]
                    .filter((item) => item && item[0])
                    .map((item) => item[0])
                    .join("");
            })
        );

        const translatedText = translatedChunks.join(" ");
        translationCache.set(cacheKey, translatedText);

        return translatedText;
    } catch (error) {
        console.error("Lỗi khi dịch văn bản dài:", error);
        return "Lỗi dịch thuật: " + error.message;
    }
}

/**
 * Phát hiện ngôn ngữ của văn bản
 * @param {string} text - Văn bản cần phát hiện ngôn ngữ
 * @returns {Promise<string>} - Mã ngôn ngữ (ví dụ: 'en', 'vi')
 */
async function detectLanguage(text) {
    try {
        // Giới hạn text để phát hiện ngôn ngữ
        const sampleText = text.slice(0, DETECT_LANGUAGE_LIMIT);

        const response = await fetch(`${GOOGLE_TRANSLATE_API}?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(sampleText)}`);
        if (!response.ok) throw new Error("API không phản hồi");
        const data = await response.json();

        // Google API trả về ngôn ngữ phát hiện được ở data[2]
        return data[2] || "auto";
    } catch (error) {
        console.error("Lỗi khi phát hiện ngôn ngữ:", error);
        return "auto";
    }
}

/**
 * Lưu bản dịch vào bookmark
 * @param {Object} translationData - Dữ liệu bản dịch cần lưu
 */
function saveTranslation(translationData) {
    // Lấy dữ liệu đã lưu trước đó
    chrome.storage.local.get(["savedTranslations"], function (result) {
        const savedTranslations = result.savedTranslations || [];
        // Thêm bản dịch mới với timestamp
        savedTranslations.push({
            ...translationData,
            timestamp: new Date().toISOString(),
        });
        // Lưu lại vào storage
        chrome.storage.local.set({ savedTranslations: savedTranslations }, function () {
            showNotification("Đã lưu bản dịch vào bookmark!");
        });
    });
}

/**
 * Hiển thị thông báo ngắn
 * @param {string} message - Nội dung thông báo
 */
function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    // Hiển thị notification
    setTimeout(() => {
        notification.classList.add("show");
    }, 10);

    // Ẩn sau 2 giây
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

/**
 * Phát âm văn bản
 * @param {string} text - Văn bản cần phát âm
 * @param {string} language - Ngôn ngữ của văn bản
 */
function speakText(text, language) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    speechSynthesis.speak(utterance);
}

// Hàm debounce để giới hạn số lần gọi API dịch khi nhập liệu
function debounce(func, delay) {
    let debounceTimer;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Khởi tạo UI và xử lý sự kiện khi trang được load
document.addEventListener("DOMContentLoaded", function () {
    chrome.runtime.sendMessage({ action: "fetchTokens" });
    const inputText = document.getElementById("input-text");
    const translatedText = document.getElementById("translated-text");
    const clearBtn = document.getElementById("clear-btn");
    const copyInputBtn = document.getElementById("copy-input");
    const copyTranslationBtn = document.getElementById("copy-translation");
    const listenTranslationBtn = document.getElementById("listen-translation");
    const saveTranslationBtn = document.getElementById("save-translation");
    const sourceLanguageSelect = document.getElementById("source-language");
    const targetLanguageSelect = document.getElementById("target-language");
    const swapBtn = document.getElementById("swap-btn");
    const profile = document.getElementById("profile");
    const avatar = document.getElementById("avatar");
    const profileName = document.getElementById("profile-name");
    const noLogin = document.getElementById("no-login");
    const setting1Button = document.querySelector(".set1");
    const setting2Button = document.querySelector(".set2");

    if (setting1Button) {
        setting1Button.addEventListener("click", function (e) {
            e.stopPropagation();
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL("option.html"));
            }
        });
    }

    if (setting2Button) {
        setting2Button.addEventListener("click", function (e) {
            e.stopPropagation();
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL("option.html"));
            }
        });
    }

    // load dữ liệu cũ từ storage
    chrome.storage.local.get(["lastWord"], function (result) {
        if (result.lastWord) {
            inputText.value = result.lastWord.text;
            translatedText.textContent = result.lastWord.result;
            sourceLanguageSelect.value = result.lastWord.sourceLanguage;
            targetLanguageSelect.value = result.lastWord.targetLanguage;
        }
    });

    // Hàm thực hiện dịch
    async function performTranslation() {
        const text = inputText.value.trim();
        if (!text) {
            translatedText.ariaPlaceholder = "Chữ sau khi dịch sẽ được hiển thị ở đây...";
            return;
        }

        translatedText.ariaPlaceholder = "Đang dịch";
        translatedText.classList.add("loading");

        let sourceLanguage = sourceLanguageSelect.value;
        const targetLanguage = targetLanguageSelect.value;

        try {
            // Tự động phát hiện ngôn ngữ nếu chọn 'auto'
            if (sourceLanguage === "auto") {
                // Hiển thị đang phát hiện ngôn ngữ
                sourceLanguageSelect.disabled = true;
                try {
                    sourceLanguage = await detectLanguage(text);
                    // Cập nhật select box với ngôn ngữ phát hiện được
                    if (sourceLanguage !== "auto" && sourceLanguage !== "und") {
                        const options = Array.from(sourceLanguageSelect.options);
                        const option = options.find((opt) => opt.value === sourceLanguage);
                        if (option) {
                            sourceLanguageSelect.value = sourceLanguage;
                        }
                    }
                } catch (error) {
                    console.error("Error detecting language:", error);
                    // Continue with auto if detection fails
                    sourceLanguage = "auto";
                } finally {
                    sourceLanguageSelect.disabled = false;
                }
            }

            // Thực hiện dịch
            const result = await translateText(text, targetLanguage, sourceLanguage);

            if (!result) {
                throw new Error("Empty translation result");
            }

            translatedText.textContent = result;
            chrome.storage.local.set({ lastWord: { text, result, sourceLanguage, targetLanguage } });
        } catch (error) {
            console.error("Translation error:", error);
            translatedText.textContent = "Error: Could not complete translation. Please try again.";
        } finally {
            translatedText.classList.remove("loading");
        }
    }

    // Tạo phiên bản debounce để tự động dịch khi nhập
    const debouncedTranslate = debounce(performTranslation, 500);

    // Thêm sự kiện input để tự động dịch khi nhập
    inputText.addEventListener("input", debouncedTranslate);
    sourceLanguageSelect.addEventListener("change", performTranslation); // Remove debounce for immediate language change
    targetLanguageSelect.addEventListener("change", performTranslation); // Remove debounce for immediate language change

    // Sự kiện nút xóa
    clearBtn.addEventListener("click", function () {
        inputText.value = "";
        translatedText.textContent = "Translation will appear here";
    });

    // Sự kiện nút sao chép input
    copyInputBtn.addEventListener("click", function () {
        if (!inputText.value.trim()) {
            showNotification("Không có văn bản");
            return;
        }
        navigator.clipboard.writeText(inputText.value);
        showNotification("Đã sao chép văn bản gốc!");
    });

    // Sự kiện nút sao chép bản dịch
    copyTranslationBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(translatedText.textContent);
        showNotification("Đã sao chép bản dịch!");
    });

    // Sự kiện nút nghe phát âm
    listenTranslationBtn.addEventListener("click", function () {
        const text = translatedText.textContent;
        if (text && text !== "Translation will appear here" && text !== "Đang dịch...") {
            speakText(text, targetLanguageSelect.value);
        }
    });

    // Sự kiện nút lưu bản dịch
    saveTranslationBtn.addEventListener("click", function () {
        const originalText = inputText.value;
        const translatedContent = translatedText.textContent;

        if (originalText && translatedContent && translatedContent !== "Translation will appear here" && translatedContent !== "Đang dịch...") {
            saveTranslation({
                originalText: originalText,
                translatedText: translatedContent,
                sourceLanguage: sourceLanguageSelect.value,
                targetLanguage: targetLanguageSelect.value,
            });
        } else {
            showNotification("Không có nội dung để lưu");
        }
    });

    // Sự kiện nút đổi ngôn ngữ
    swapBtn.addEventListener("click", function () {
        // Chỉ đổi ngôn ngữ khi source không phải là 'auto'
        if (sourceLanguageSelect.value !== "auto") {
            const temp = sourceLanguageSelect.value;
            sourceLanguageSelect.value = targetLanguageSelect.value;
            targetLanguageSelect.value = temp;

            // Cũng đổi nội dung nếu đã có bản dịch
            if (translatedText.textContent !== "Translation will appear here" && translatedText.textContent !== "Đang dịch...") {
                const tempText = inputText.value;
                inputText.value = translatedText.textContent;
                translatedText.textContent = tempText;
            }

            // Trigger translation if needed
            if (inputText.value.trim()) {
                debouncedTranslate();
            }
        } else {
            showNotification("Không thể hoán đổi khi đang ở chế độ phát hiện tự động");
        }
    });

    // thay đổi hình ảnh src của avatar
    chrome.storage.local.get(["profile", "token"], async function (result) {
        if (result.token == null) {
            profile.style.display = "none";
            noLogin.style.display = "flex";
            showNotification("Bạn chưa đăng nhập");
        } else if (result.profile == null) {
            noLogin.style.display = "none";
            profileName.innerText = "Đang tải thông tin người dùng...";
            avatar.setAttribute("src", "https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif");
            showNotification("Đang tải thông tin người dùng");
        } else {
            profile.style.display = "flex";
            noLogin.style.display = "none";
            avatar.setAttribute("src", result.profile.profilePicture);
            avatar.setAttribute("alt", result.profile.displayName);
            avatar.setAttribute("href", "https://www.quizzet.site/profile/" + result.profile._id);
            avatar.setAttribute("target", "_blank");
            profileName.textContent = result.profile.displayName;
            profileName.setAttribute("href", "https://www.quizzet.site/profile/" + result.profile._id);
            profileName.setAttribute("target", "_blank");
            showNotification("Load thông tin người dùng thành công");
        }
    });

    // Sự kiện nhấn Enter trong textarea để dịch
    inputText.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // Ngăn xuống dòng
            performTranslation();
        }
    });
});
