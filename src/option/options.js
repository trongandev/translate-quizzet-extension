document.addEventListener("DOMContentLoaded", function () {
    const selectFlashcard = document.getElementById("sourceFlashcard");
    const sourceLanguage = document.getElementById("sourceLanguage");
    const btnRefresh = document.getElementById("btn-refresh");
    const token = document.getElementById("token");

    if (selectFlashcard) {
        addAppendChildOptionFlashcard(selectFlashcard);
        selectFlashcard.addEventListener("change", function (e) {
            const selectedId = e.target.value;
            chrome.storage.local.set({ list_flashcard_id: selectedId });
        });
    }
    if (sourceLanguage) {
        chrome.storage.local.get(["target_language"], function (result) {
            if (result.hasOwnProperty("target_language") && result.target_language) {
                sourceLanguage.value = result.target_language;
            } else {
                sourceLanguage.value = "english";
                chrome.storage.local.set({ target_language: "english" });
            }
        });

        sourceLanguage.addEventListener("change", function (e) {
            const selectedId = e.target.value;
            chrome.storage.local.set({ target_language: selectedId });
        });
    }

    if (btnRefresh) {
        btnRefresh.addEventListener("click", function () {
            chrome.runtime.sendMessage({ action: "refresh" }, function (response) {
                showNotification("Đã làm mới dữ liệu từ vựng!");
                setTimeout(() => {
                    document.location.reload();
                }, 500);
            });
        });
    }

    if (token) {
        chrome.storage.local.get(["token"], function (result) {
            if (result.hasOwnProperty("token") && result.token) {
                token.value = result.token;
            } else {
                token.placeholder = "Nhập token tại đây...";
            }
        });

        token.addEventListener("change", function (e) {
            const selectedId = e.target.value;
            chrome.storage.local.set({ token: selectedId });
        });
    }
});

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

function addAppendChildOptionFlashcard(selectFlashcard) {
    chrome.storage.local.get(["listFlashCards"], function (result) {
        const flashcardList = result.listFlashCards;
        if (flashcardList && flashcardList.length > 0) {
            selectFlashcard.innerHTML = "";
            flashcardList.forEach((item) => {
                const option = document.createElement("option");
                option.value = item._id;
                option.textContent = `${item.title} | ${item.language} | ${item.flashcards.length == 0 ? "Chưa có từ vựng" : item.flashcards.length + " từ"} `;
                selectFlashcard.appendChild(option);
            });
        }
        chrome.storage.local.get(["list_flashcard_id"], function (result) {
            if (result.hasOwnProperty("list_flashcard_id") && result.list_flashcard_id) {
                selectFlashcard.value = result.list_flashcard_id;
            } else {
                selectFlashcard.value = flashcardList[0]._id;
                chrome.storage.local.set({ list_flashcard_id: flashcardList[0]._id });
            }
        });
    });
}
