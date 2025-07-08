// Resources and constants
const ICONS = {
    main: chrome.runtime.getURL("../assets/icons.png"),
    volume: chrome.runtime.getURL("../assets/volume-2.svg"),
    close: chrome.runtime.getURL("../assets/x.svg"),
    star: chrome.runtime.getURL("../assets/star-fill.svg"),
    settings: chrome.runtime.getURL("../assets/settings.svg"),
    sparkles: chrome.runtime.getURL("../assets/sparkles.svg"),
};

const MIN_MODAL_WIDTH = 180;
const BUTTON_SIZE = 25;
const Z_INDEX_BASE = 10000;

// Create UI elements
function createTranslationButton() {
    const button = document.createElement("button");
    button.className = "custom-button";
    button.style.position = "absolute";
    button.style.border = "2px solid #ccc";
    button.style.fontSize = "16px";
    button.style.borderRadius = "5px";
    button.style.width = `${BUTTON_SIZE}px`;
    button.style.height = `${BUTTON_SIZE}px`;
    button.style.display = "none";
    button.style.cursor = "pointer";
    button.style.zIndex = Z_INDEX_BASE.toString();
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.backgroundColor = "#fff";
    button.style.backgroundImage = `url('${ICONS.main}')`;
    button.style.backgroundSize = "cover";
    button.style.backgroundRepeat = "no-repeat";
    return button;
}

function createTranslationModal() {
    const modal = document.createElement("div");
    modal.className = "quizzet-translator";
    modal.style.position = "absolute";
    modal.style.zIndex = (Z_INDEX_BASE + 1).toString();
    modal.style.display = "none";
    modal.style.backgroundColor = "#fff";
    modal.style.borderRadius = "10px";
    modal.style.boxShadow = "rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px";
    modal.style.fontFamily = "Segoe UI, Tahoma, Geneva, Verdana, sans-serif";
    modal.style.minHeight = "80px";
    return modal;
}

// HTML templates
function getHTMLTemplate(translation) {
    const matches = translation?.matches || [{ translation: "No translation available" }, { translation: "" }, { translation: "" }];

    return `
     <div class="quizzet-translator">
            <style>
                .quizzet-translator {
                    min-width: 200px;
                    min-height: 80px;
                    box-shadow: rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
                    border-radius: 10px;
                    font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif;
                }
                .quizzet-translator .header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 15px;
                    flex: 1;
                }

                .quizzet-translator img {
                    width: 17px;
                    height: 17px;
                    cursor: pointer;
                    object-fit: cover;
                }

                .quizzet-translator .header .right {
                    display: flex;
                    gap: 3px;
                    align-items: center;
                }
                .quizzet-translator main {
                    border-top: 1px dashed #dfe0e3;
                }
                .quizzet-translator main p {
                    margin: 0;
                    padding: 10px 15px;
                    color: #1a1f2a;
                    font-size: 14px;
                }
                .quizzet-translator footer {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .quizzet-translator footer p.type {
                    color: #94acbf;
                    font-style: italic;
                    margin: 0;
                    font-size: 13px;
                }
                .quizzet-translator footer p.content {
                    color: #3b3b3b;
                    font-style: normal;
                    font-size: 14px;
                    margin: 0;
                    padding: 0;
                }
                .quizzet-translator footer div {
                    border-top: 1px dashed #dfe0e3;
                    padding: 5px 15px;
                }
                .quizzet-translator .save {
                    border:none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #1a6bb0;
                    border-radius: 0 0 10px 10px;
                    cursor: pointer;
                    gap: 8px;
                    font-size: 12px;
                    background-color:rgba(26, 106, 176, 0.1);
                }
                .quizzet-translator .save:hover {
                    background-color: rgba(26, 106, 176, 0.3);
                }
            </style>
            <div class="header">
                <img src="${ICONS.volume}" alt="Speak" class="speak-button" title="Phát âm thanh" />
                <img src="${ICONS.sparkles}" title="Dịch bằng AI" alt="Speak" class="sparkles-button" />
                <div class="right">
                    <img src="${ICONS.settings}" alt="Settings" class="settings-button" />
                    <img src="${ICONS.close}" alt="Close" class="close-button" title="Đóng cửa sổ" />
                </div>
            </div>
            <main>
                <p class="translate-vi">${matches[0]?.translation || ""}</p>
            </main>
            <footer>
                ${
                    matches[1]?.partOfSpeech
                        ? `<div class="">
                            <p class="type">${matches[1]?.partOfSpeech}</p>
                        </div>`
                        : ""
                }
                
                <button class="save" title="Thay đổi vị trí lưu flashcard, bấm vào setting">  <img src="${ICONS.star}" alt="Save" class="save-button" /><p>Lưu vào Flashcard</p></button>
            </footer>
        </div>
      
    `;
}

const LOADER_UI = `
    <div class="spinner-container-quizzet">
        <div class="spinner">
            <span></span>
            <span></span>
            <span></span>
            <style>
                .spinner-container-quizzet {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .spinner-container-quizzet .spinner {
                    --clr: #2187d5;
                    --gap: 6px;
                    width: 70px;
                    height: 50px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: var(--gap);
                }

                .spinner-container-quizzet .spinner span {
                    width: 15px;
                    height: 15px;
                    border-radius: 100%;
                    background-color: var(--clr);
                    opacity: 0;
                }

                .spinner-container-quizzet .spinner span:nth-child(1) {
                    animation: fade 1s ease-in-out infinite;
                }

                .spinner-container-quizzet .spinner span:nth-child(2) {
                    animation: fade 1s ease-in-out 0.33s infinite;
                }

                .spinner-container-quizzet .spinner span:nth-child(3) {
                    animation: fade 1s ease-in-out 0.66s infinite;
                }

                @keyframes fade {
                    0%,
                    100% {
                        opacity: 1;
                    }

                    60% {
                        opacity: 0;
                    }
                }
            </style>
        </div>
    </div>
`;

// Create and append UI elements
const customButton = createTranslationButton();
const translationModal = createTranslationModal();
document.body.appendChild(customButton);
document.body.appendChild(translationModal);

// Helper functions
function positionButtonAtSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Calculate center position of the selection
    const selectionCenter = rect.left + rect.width / 2;

    // Calculate button position (centered below selection)
    const buttonLeft = selectionCenter - BUTTON_SIZE / 2 + window.scrollX;
    const buttonTop = rect.bottom + window.scrollY + 5;

    // Position and show the custom button
    customButton.style.left = `${buttonLeft}px`;
    customButton.style.top = `${buttonTop}px`;

    return { range, rect };
}

function showTranslationButton() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        const result = positionButtonAtSelection();
        if (result) {
            customButton.style.display = "flex";
            translationModal.style.display = "none";
            return true;
        }
    }
    return false;
}

function hideUI() {
    customButton.style.display = "none";
    translationModal.style.display = "none";
}

function showUI() {
    customButton.style.display = "none";
    translationModal.style.display = "block";
}

function requestTranslation(text) {
    translationModal.innerHTML = LOADER_UI;

    try {
        chrome.runtime.sendMessage(
            {
                action: "translate",
                text: text,
                targetLanguage: "vi", // Default target language
            },
            function (response) {
                if (response && !response.error) {
                    translationModal.innerHTML = getHTMLTemplate(response.translation);
                    setupModalEventListeners(text);
                } else {
                    translationModal.innerHTML = `
                        <div style="padding: 15px; text-align: center;">
                            <p>Translation failed: ${response?.error || "Unknown error"}</p>
                        </div>
                    `;
                }
            }
        );
    } catch (error) {
        console.error("Translation request error:", error);
        translationModal.innerHTML = `
            <div style="padding: 15px; text-align: center;">
                <p>Error occurred during translation: ${error.message}</p>
            </div>
        `;
    }
}

function setupModalEventListeners(text) {
    const closeButton = translationModal.querySelector(".close-button");
    if (closeButton) {
        closeButton.addEventListener("click", function (e) {
            e.stopPropagation();
            hideUI();
        });
    }
    const speakButton = translationModal.querySelector(".speak-button");
    if (speakButton) {
        speakButton.addEventListener("click", function (e) {
            e.stopPropagation();
            showUI();
            showNotification("Đang phát âm");
            if (text) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = "en-US";
                speechSynthesis.speak(utterance);
            }
        });
    }
    const settingButton = translationModal.querySelector(".settings-button");
    if (settingButton) {
        settingButton.addEventListener("click", function (e) {
            e.stopPropagation();
            showUI();

            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL("src/option/option.html"));
            }
        });
    }

    const sparklesButton = translationModal.querySelector(".sparkles-button");
    if (sparklesButton) {
        sparklesButton.addEventListener("click", function (e) {
            e.stopPropagation();
            showUI();
            sparklesButton.style.cursor = "wait";
            sparklesButton.style.opacity = "0.5";
            showNotification("Đang dịch bằng AI...");
            chrome.runtime.sendMessage({ action: "ai-enhance", text }, function (response) {
                if (response.ok) {
                    translationModal.querySelector(".quizzet-translator main p.translate-vi").textContent = response.parse;
                    showNotification("Đã tối ưu hóa nội dung");
                } else {
                    showNotification("Không thể tối ưu hóa nội dung");
                }
                sparklesButton.style.cursor = "pointer";
                sparklesButton.style.opacity = "1";
            });
        });
    }

    const saveButton = translationModal.querySelector(".save");
    const textBtn = saveButton.querySelector("p");
    chrome.storage.local.get(["list_flashcard_id"], function (result) {
        if (!result.list_flashcard_id) {
            textBtn.textContent = `Bạn chưa đăng nhập, bấm vào cài đặt`;
            window.open(chrome.runtime.getURL("src/option/option.html"));
            saveButton.style.cursor = "not-allowed";
            saveButton.style.opacity = "0.5";
            return;
        }
        textBtn.textContent = `Lưu vào Flashcard`;
    });
    if (saveButton) {
        saveButton.addEventListener("click", function (e) {
            e.stopPropagation();
            saveButton.style.cursor = "wait";
            saveButton.style.opacity = "0.5";
            showUI();
            if (text) {
                // Save translation to local storage or send to server
                chrome.storage.local.get(["list_flashcard_id"], function (result) {
                    showNotification(`Đang lưu từ vựng vào ["${result.list_flashcard_id.name}"] `);
                    list_flashcard_id = result.list_flashcard_id.id;
                    textBtn.textContent = `Đang lưu...`;
                    if (!list_flashcard_id) {
                        showNotification("Vui lòng chọn flashcard trước khi lưu, vào setting để chọn flashcard");
                        saveButton.style.cursor = "pointer";
                        saveButton.style.opacity = "1";
                        return;
                    }
                    chrome.runtime.sendMessage(
                        {
                            action: "save-translation",
                            text: text,
                            list_flashcard_id,
                        },
                        function (response) {
                            if (!response.ok) {
                                showNotification("Lưu từ vựng thất bại");
                            } else {
                                showNotification(`Lưu từ "${response.flashcard.title}" vào flashcard ["${result.list_flashcard_id.name}"] thành công`);
                                saveButton.style.cursor = "pointer";
                                saveButton.style.opacity = "1";
                                textBtn.textContent = `Lưu vào Flashcard`;
                            }
                        }
                    );
                });
            }
        });
    }
}

// Event Listeners
document.addEventListener("mouseup", function (event) {
    showTranslationButton();
});

document.addEventListener("dblclick", function () {
    showTranslationButton();
});

document.addEventListener("mousedown", function (event) {
    // Only hide if clicking outside our UI elements
    if (!customButton.contains(event.target) && !translationModal.contains(event.target)) {
        hideUI();
    }
});

customButton.addEventListener("click", function (event) {
    event.stopPropagation();

    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) return;

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Set translation modal dimensions
    const modalWidth = Math.max(rect.width, MIN_MODAL_WIDTH);
    translationModal.style.width = `${modalWidth}px`;

    // Calculate position to align with selection
    const modalLeft = rect.left + window.scrollX;
    const modalTop = rect.bottom + window.scrollY + 10;

    // Position modal directly under selection
    translationModal.style.left = `${modalLeft}px`;
    translationModal.style.top = `${modalTop}px`;

    translationModal.style.display = "block";
    customButton.style.display = "none";

    requestTranslation(selectedText);
});

// Initialize
translationModal.addEventListener("click", function (e) {
    e.stopPropagation();
});

function showNotification(message) {
    const style = document.createElement("style");
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 50%;
            transform: translateX(50%);
            background-color: #4caf50;
            color: white !important;
            padding: 15px;
            border-radius: 5px;
            z-index: ${Z_INDEX_BASE + 2};
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }
        .notification.show {
            opacity: 1;
        }
        .notification.error {
            background-color: #f44336;
        }
        .notification.success {
            background-color: #4caf50;
        }
    `;

    document.head.appendChild(style);

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
