// Resources and constants
const ICONS = {
    main: chrome.runtime.getURL("../assets/icons.png"),
    volume: chrome.runtime.getURL("../assets/volume-2.svg"),
    close: chrome.runtime.getURL("../assets/x.svg"),
    star: chrome.runtime.getURL("../assets/star-fill.svg"),
    settings: chrome.runtime.getURL("../assets/settings.svg"),
    sparkles: chrome.runtime.getURL("../assets/sparkles.svg"),
    bookOpen: chrome.runtime.getURL("../assets/book-open.svg"),
}
const GOOGLE_TRANSLATE_API = "https://translate.googleapis.com/translate_a/single"
const DETECT_LANGUAGE_LIMIT = 100 // Số ký tự tối đa để phát hiện ngôn ngữ
async function detectLanguage(text) {
    try {
        // Use only a portion of text for detection to save bandwidth
        const sampleText = text.slice(0, DETECT_LANGUAGE_LIMIT)
        const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(sampleText)}`
        const response = await fetch(url)
        const data = await response.json()
        return data && data[2] ? data[2] : "auto"
    } catch (error) {
        console.error("Language detection error:", error)
        return "auto" // Default fallback
    }
}

const MIN_MODAL_WIDTH = 180
const BUTTON_SIZE = 25
const Z_INDEX_BASE = 10000

// Create UI elements
function createTranslationButton() {
    const button = document.createElement("button")
    button.className = "custom-button"
    button.style.position = "absolute"
    button.style.border = "2px solid #ccc"
    button.style.fontSize = "16px"
    button.style.borderRadius = "5px"
    button.style.width = `${BUTTON_SIZE}px`
    button.style.height = `${BUTTON_SIZE}px`
    button.style.display = "none"
    button.style.cursor = "pointer"
    button.style.zIndex = Z_INDEX_BASE.toString()
    button.style.alignItems = "center"
    button.style.justifyContent = "center"
    button.style.backgroundColor = "#fff"
    button.style.backgroundImage = `url('${ICONS.main}')`
    button.style.backgroundSize = "cover"
    button.style.backgroundRepeat = "no-repeat"
    return button
}

function createTranslationModal() {
    // Host element: used for positioning on the page. Keep minimal styles here so
    // page CSS doesn't leak into our UI.
    const host = document.createElement("div")
    host.className = "quizzet-translator-host"
    host.style.position = "absolute"

    host.style.zIndex = (Z_INDEX_BASE + 1).toString()
    host.style.display = "none"
    host.style.minHeight = "80px"

    // Attach shadow root to isolate styles and markup from the page.
    const shadow = host.attachShadow({ mode: "open" })

    // Empty container inside shadow; we'll inject our template into shadowRoot
    const container = document.createElement("div")
    container.className = "quizzet-translator"
    container.style.width = "100%"
    shadow.appendChild(container)

    return host
}

// HTML templates
function getHTMLTemplate(response) {
    const { translation, profile, list_flashcard_id } = response
    const matches = translation?.matches || [{ translation: "No translation available" }, { translation: "" }, { translation: "" }]

    return `
     <div class="quizzet-translator">
            <style>
                .quizzet-translator {
                    min-width: 200px;
                    min-height: 80px;
                    box-shadow: rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
                    border-radius: 10px;
                    font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #fff;
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
                    padding-top: 5px;
                }
                .quizzet-translator footer p.type {
                    color: #94acbf;
                    font-style: italic;
                    margin: 0;
                    font-size: 13px;
                }
                .quizzet-translator footer p {
                    font-style: normal;
                    font-size: 14px;
                    margin: 0;
                    padding: 0;
                }
                .quizzet-translator footer .part-of-speech {
                    border-top: 1px dashed #dfe0e3;
                    padding: 10px ;
                }
                .quizzet-translator .save {
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #1a6bb0;
                    border-radius: 0 0 10px 10px;
                    cursor: pointer;
                    gap: 8px;
                    font-size: 12px;
                    height: 38px;
                    background-color: rgba(26, 106, 176, 0.1);
                }
                .quizzet-translator .save:hover {
                    background-color: rgba(26, 106, 176, 0.3);
                }
                .quizzet-translator .avatar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                      color: #1a1f2a;
                }
                .quizzet-translator .avatar .profile-picture {
                    border-radius: 50%;
                    width: 38px;
                    height: 38px;
                    object-fit: cover;
                }
                             .quizzet-translator .avatar .name {
                                flex: 1;
                             
                             }
                .quizzet-translator .avatar h2 {
                    font-size: 14px;
                    font-weight: 400;
                    margin: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                .quizzet-translator select {
                    margin-top: 4px;
                    width: 100%;
                    padding: 6px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 12px;
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
                        ? `<div class=" part-of-speech">
                            <p class="type">${matches[1]?.partOfSpeech}</p>
                        </div>`
                        : ""
                }
                ${
                    profile
                        ? ` <div class="avatar  part-of-speech">
                            <img class="profile-picture" src="${profile.profilePicture}" alt="" />
                            <div class="name">
                                <h2>${profile.displayName}</h2>
                                <h2 class="">
                             ${list_flashcard_id.language.slice(0, 3).toUpperCase() + " | " + list_flashcard_id.title}
                                </h2>
                            </div>
                        </div>`
                        : ""
                }
                
                <button class="save" title="Thay đổi vị trí lưu flashcard, bấm vào setting">  <img src="${ICONS.star}" alt="Save" class="save-button" /><p>Lưu vào Flashcard</p></button>
            </footer>
        </div>
      
    `
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
                     background-color: #fff;
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
`

// Create and append UI elements
const customButton = createTranslationButton()
const translationModal = createTranslationModal()
document.body.appendChild(customButton)
document.body.appendChild(translationModal)

// Helper functions
function positionButtonAtSelection() {
    const selection = window.getSelection()
    if (!selection.rangeCount) return false

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Calculate center position of the selection
    const selectionCenter = rect.left + rect.width / 2

    // Calculate button position (centered below selection)
    const buttonLeft = selectionCenter - BUTTON_SIZE / 2 + window.scrollX
    const buttonTop = rect.bottom + window.scrollY + 5

    // Position and show the custom button
    customButton.style.left = `${buttonLeft}px`
    customButton.style.top = `${buttonTop}px`

    return { range, rect }
}

function showTranslationButton() {
    const selectedText = window.getSelection().toString().trim()
    if (selectedText) {
        const result = positionButtonAtSelection()
        if (result) {
            customButton.style.display = "flex"
            translationModal.style.display = "none"
            return true
        }
    }
    return false
}

function hideUI() {
    customButton.style.display = "none"
    translationModal.style.display = "none"
}

function showUI() {
    customButton.style.display = "none"
    translationModal.style.display = "block"
}

function requestTranslation(text) {
    // Render loader inside shadowRoot to avoid page CSS interference
    if (translationModal.shadowRoot) {
        translationModal.shadowRoot.innerHTML = LOADER_UI
    } else {
        translationModal.innerHTML = LOADER_UI
    }

    try {
        chrome.storage.local.get(["target_language"], function (result) {
            chrome.runtime.sendMessage(
                {
                    action: "translate",
                    text: text,
                    targetLanguage: result.target_language, // Default target language
                },
                function (response) {
                    if (response && !response.error) {
                        const html = getHTMLTemplate(response)
                        if (translationModal.shadowRoot) {
                            translationModal.shadowRoot.innerHTML = html
                        } else {
                            translationModal.innerHTML = html
                        }
                        setupModalEventListeners(text)
                    } else {
                        const errHtml = `
                            <div style="padding: 15px; text-align: center;">
                                <p>Translation failed: ${response?.error || "Unknown error"}</p>
                            </div>
                        `
                        if (translationModal.shadowRoot) {
                            translationModal.shadowRoot.innerHTML = errHtml
                        } else {
                            translationModal.innerHTML = errHtml
                        }
                    }
                }
            )
        })
    } catch (error) {
        console.error("Translation request error:", error)
        const errHtml = `
            <div style="padding: 15px; text-align: center;">
                <p>Error occurred during translation: ${error.message}</p>
            </div>
        `
        if (translationModal.shadowRoot) {
            translationModal.shadowRoot.innerHTML = errHtml
        } else {
            translationModal.innerHTML = errHtml
        }
    }
}

async function setupModalEventListeners(text) {
    const root = translationModal.shadowRoot || translationModal
    const closeButton = root.querySelector(".close-button")
    if (closeButton) {
        closeButton.addEventListener("click", function (e) {
            e.stopPropagation()
            hideUI()
        })
    }
    const speakButton = root.querySelector(".speak-button")
    if (speakButton) {
        speakButton.addEventListener("click", async function (e) {
            e.stopPropagation()
            showUI()
            showNotification("Đang phát âm")
            if (text) {
                const utterance = new SpeechSynthesisUtterance(text)
                utterance.lang = (await detectLanguage(text)) || "en-US"
                speechSynthesis.speak(utterance)
            }
        })
    }
    const settingButton = root.querySelector(".settings-button")
    if (settingButton) {
        settingButton.addEventListener("click", function (e) {
            e.stopPropagation()
            showUI()

            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage()
            } else {
                window.open(chrome.runtime.getURL("src/option/option.html"))
            }
        })
    }

    const sparklesButton = root.querySelector(".sparkles-button")
    if (sparklesButton) {
        sparklesButton.addEventListener("click", function (e) {
            e.stopPropagation()
            showUI()
            sparklesButton.style.cursor = "wait"
            sparklesButton.style.opacity = "0.5"
            showNotification("Đang dịch bằng AI...")
            chrome.runtime.sendMessage({ action: "ai-enhance", text }, function (response) {
                if (response.ok) {
                    const p = (translationModal.shadowRoot || translationModal).querySelector(".quizzet-translator main p.translate-vi")
                    if (p) p.textContent = response.parse
                    showNotification("Đã tối ưu hóa nội dung")
                } else {
                    showNotification("Không thể tối ưu hóa nội dung")
                }
                sparklesButton.style.cursor = "pointer"
                sparklesButton.style.opacity = "1"
            })
        })
    }

    const saveButton = root.querySelector(".save")
    const textBtn = saveButton ? saveButton.querySelector("p") : null
    chrome.storage.local.get(["list_flashcard_id"], function (result) {
        if (!result.list_flashcard_id) {
            if (textBtn) textBtn.textContent = `Vui lòng đăng nhập`
            saveButton.style.cursor = "not-allowed"
            saveButton.style.opacity = "0.5"
            return
        }
        if (textBtn) textBtn.textContent = `Lưu vào Flashcard`
    })
    if (saveButton) {
        saveButton.addEventListener("click", function (e) {
            e.stopPropagation()
            saveButton.style.cursor = "wait"
            saveButton.style.opacity = "0.5"
            showUI()
            if (text) {
                // Save translation to local storage or send to server
                chrome.storage.local.get(["list_flashcard_id"], function (result) {
                    showNotification(`Đang lưu từ vựng vào ["${result.list_flashcard_id.title}"] `)
                    list_flashcard_id = result.list_flashcard_id._id
                    if (textBtn) textBtn.textContent = `Đang lưu...`
                    if (!list_flashcard_id) {
                        showNotification("Vui lòng chọn flashcard trước khi lưu, vào setting để chọn flashcard")
                        saveButton.style.cursor = "pointer"
                        saveButton.style.opacity = "1"
                        return
                    }
                    chrome.runtime.sendMessage(
                        {
                            action: "save-translation",
                            text: text,
                            list_flashcard_id,
                        },
                        function (response) {
                            if (!response.ok) {
                                showNotification(response.message)
                            } else {
                                showNotification(`Lưu từ "${response.flashcard.title}" vào flashcard ["${result.list_flashcard_id.title}"] thành công`)
                                saveButton.style.cursor = "pointer"
                                saveButton.style.opacity = "1"
                                if (textBtn) textBtn.textContent = `Lưu vào Flashcard`
                            }
                        }
                    )
                })
            }
        })
    }
}

// Event Listeners
document.addEventListener("mouseup", function (event) {
    showTranslationButton()
})

document.addEventListener("dblclick", function () {
    showTranslationButton()
})

document.addEventListener("mousedown", function (event) {
    // Only hide if clicking outside our UI elements
    // Use composedPath to detect clicks that occur inside shadow DOM
    const path = event.composedPath ? event.composedPath() : event.path || []
    const clickedInsideModal = path.includes(translationModal)
    if (!customButton.contains(event.target) && !clickedInsideModal) {
        hideUI()
    }
})

customButton.addEventListener("click", function (event) {
    event.stopPropagation()

    const selectedText = window.getSelection().toString().trim()
    if (!selectedText) return

    const selection = window.getSelection()
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Set translation modal dimensions
    const modalWidth = Math.max(rect.width, MIN_MODAL_WIDTH)
    translationModal.style.width = `${modalWidth}px`

    // Calculate position to align with selection
    const modalLeft = rect.left + window.scrollX
    const modalTop = rect.bottom + window.scrollY + 10

    // Position modal directly under selection
    translationModal.style.left = `${modalLeft}px`
    translationModal.style.top = `${modalTop}px`

    translationModal.style.display = "block"
    customButton.style.display = "none"

    requestTranslation(selectedText)
})

// Initialize
translationModal.addEventListener("click", function (e) {
    e.stopPropagation()
})

function showNotification(message) {
    const style = document.createElement("style")
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
    `

    document.head.appendChild(style)

    const notification = document.createElement("div")
    notification.className = "notification"
    notification.textContent = message
    document.body.appendChild(notification)

    // Hiển thị notification
    setTimeout(() => {
        notification.classList.add("show")
    }, 10)

    // Ẩn sau 2 giây
    setTimeout(() => {
        notification.classList.remove("show")
        setTimeout(() => {
            notification.remove()
        }, 300)
    }, 2000)
}
