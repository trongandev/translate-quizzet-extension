document.addEventListener("DOMContentLoaded", function () {
    const selectFlashcard = document.getElementById("sourceFlashcard");
    const sourceLanguage = document.getElementById("sourceLanguage");
    const btnRefresh = document.getElementById("btn-refresh");
    const profile = document.querySelector(".profile");
    const btnDanger = document.querySelector(".btn-danger");
    const btnRefreshPage = document.querySelector("#refresh");
    const feature = document.querySelector(".feature");
    if (btnDanger) {
        btnDanger.addEventListener("click", function () {
            window.open("https://www.quizzet.site/login", "_blank");
            btnDanger.style.display = "none";
            btnRefreshPage.style.display = "block";
        });
    }
    if (btnRefreshPage) {
        btnRefreshPage.addEventListener("click", function () {
            chrome.runtime.sendMessage({ action: "refresh" }, function (response) {
                document.location.reload();
            });
        });
    }

    if (profile) {
        chrome.runtime.sendMessage({ action: "refresh" }, function (response) {
            if (response.ok) {
                profile.innerHTML = `<img src=${response.user.profilePicture} alt="" />
                                         <h3>${response.user.displayName}</h3>`;
                btnDanger.style.display = "none";
                feature.style.display = "block";

                response.listFlashCards.forEach((item) => {
                    const option = document.createElement("option");
                    option.value = item._id;
                    option.textContent = `${item.title} | ${item.language.toUpperCase()}`;
                    selectFlashcard.appendChild(option);
                });

                selectFlashcard.value = response.listFlashCards[0]._id;
            } else {
                profile.innerHTML = "<h3>Bạn chưa đăng nhập</h3>";
                btnDanger.style.display = "block";
            }
        });
    }

    if (selectFlashcard) {
        addAppendChildOptionFlashcard(selectFlashcard);
        selectFlashcard.addEventListener("change", function (e) {
            const selectedId = e.target.value;
            const name = e.target.options[e.target.selectedIndex].textContent;

            // Lưu với error handling và callback
            chrome.storage.local.set({ list_flashcard_id: { id: selectedId, name } }, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error saving flashcard selection:", chrome.runtime.lastError);
                    showNotification("Lỗi khi lưu lựa chọn flashcard!");
                } else {
                    console.log("Successfully saved flashcard selection:", { id: selectedId, name });
                }
            });
        });
    }
    if (sourceLanguage) {
        chrome.storage.local.get(["target_language"], function (result) {
            if (chrome.runtime.lastError) {
                console.error("Error reading target_language:", chrome.runtime.lastError);
                sourceLanguage.value = "english";
                return;
            }

            if (result.hasOwnProperty("target_language") && result.target_language) {
                sourceLanguage.value = result.target_language;
            } else {
                sourceLanguage.value = "english";
                chrome.storage.local.set({ target_language: "english" }, function () {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving default target_language:", chrome.runtime.lastError);
                    }
                });
            }
        });
        sourceLanguage.addEventListener("change", function (e) {
            const selectedId = e.target.value;
            chrome.storage.local.set({ target_language: selectedId }, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error saving target_language:", chrome.runtime.lastError);
                    showNotification("Lỗi khi lưu ngôn ngữ!");
                } else {
                    console.log("Successfully saved target_language:", selectedId);
                }
            });
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
        if (chrome.runtime.lastError) {
            console.error("Error reading listFlashCards:", chrome.runtime.lastError);
            showNotification("Lỗi khi đọc danh sách flashcard!");
            return;
        }

        const flashcardList = result.listFlashCards || [];

        // First check if we have any flashcard lists
        if (flashcardList && flashcardList.length > 0) {
            // Clear existing options
            selectFlashcard.innerHTML = "";

            // Populate the dropdown with available options
            flashcardList.forEach((item) => {
                const option = document.createElement("option");
                option.value = item._id;
                option.textContent = `${item.title} | ${item.language.toUpperCase()}`;
                selectFlashcard.appendChild(option);
            });

            // Now check if list_flashcard_id exists to set the selected option
            chrome.storage.local.get(["list_flashcard_id"], function (listResult) {
                if (chrome.runtime.lastError) {
                    console.error("Error reading list_flashcard_id:", chrome.runtime.lastError);
                    // Set default anyway
                    setDefaultFlashcard(selectFlashcard, flashcardList);
                    return;
                }

                if (listResult.hasOwnProperty("list_flashcard_id") && listResult.list_flashcard_id && listResult.list_flashcard_id.id) {
                    // Verify the saved ID still exists in the flashcard list
                    const existingFlashcard = flashcardList.find((item) => item._id === listResult.list_flashcard_id.id);

                    if (existingFlashcard) {
                        // If list_flashcard_id exists and is valid, set the dropdown value
                        selectFlashcard.value = listResult.list_flashcard_id.id;
                        console.log("Set selected flashcard from storage:", listResult.list_flashcard_id.name);
                    } else {
                        // If the saved flashcard no longer exists, set default
                        console.log("Saved flashcard no longer exists, setting default");
                        setDefaultFlashcard(selectFlashcard, flashcardList);
                    }
                } else {
                    // If list_flashcard_id doesn't exist, set it to the first item in the list
                    setDefaultFlashcard(selectFlashcard, flashcardList);
                }
            });
        } else {
            showNotification("Không có flashcard nào được lưu trữ, bạn chưa đăng nhập");
            // Handle the case where there are no flashcards available
            selectFlashcard.innerHTML = "<option value=''>No flashcards available</option>";
        }
    });
}

function setDefaultFlashcard(selectFlashcard, flashcardList) {
    if (flashcardList.length > 0) {
        const defaultId = flashcardList[0]._id;
        const defaultName = flashcardList[0].title;

        // Set the dropdown value
        selectFlashcard.value = defaultId;

        // Save to storage with error handling
        chrome.storage.local.set({
            list_flashcard_id: {
                id: defaultId,
                name: defaultName,
            },
        });
    } else {
        showNotification("Không có flashcard nào hiện tại");
        console.log("No flashcards available to set as default");
    }
}
