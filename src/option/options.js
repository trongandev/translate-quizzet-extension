document.addEventListener("DOMContentLoaded", function () {
    // Kiểm tra storage integrity trước
    checkStorageIntegrity();
    const selectFlashcard = document.getElementById("sourceFlashcard");
    const sourceLanguage = document.getElementById("sourceLanguage");
    const btnRefresh = document.getElementById("btn-refresh");
    const profile = document.querySelector(".profile");
    const btnDanger = document.querySelector(".btn-danger");

    if (profile) {
        chrome.storage.local.get(["token", "profile"], function (result) {
            if (chrome.runtime.lastError) {
                console.error("Error reading token:", chrome.runtime.lastError);
                profile.innerHTML = "<h3>Bạn chưa đăng nhập</h3>";
                btnDanger.style.display = "block";
            } else {
                if (result.token) {
                    console.log(result);
                    profile.innerHTML = `<img src=${result.profile.profilePicture} alt="" />
                                         <h3>${result.profile.displayName}</h3>`;
                    btnDanger.style.display = "none";
                } else {
                    profile.innerHTML = "<h3>Bạn chưa đăng nhập</h3>";
                    btnDanger.style.display = "block";
                }
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
                option.textContent = `${item.title} | ${item.language} | ${item.flashcards.length == 0 ? "Chưa có từ vựng" : item.flashcards.length + " từ"} `;
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
            showNotification("Không có flashcard nào được lưu trữ");
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
        chrome.storage.local.set(
            {
                list_flashcard_id: {
                    id: defaultId,
                    name: defaultName,
                },
            },
            function () {
                if (chrome.runtime.lastError) {
                    console.error("Error saving default flashcard:", chrome.runtime.lastError);
                    showNotification("Lỗi khi lưu flashcard mặc định!");
                } else {
                    console.log("Successfully saved default flashcard:", defaultName);
                    showNotification("Đã chọn flashcard đầu tiên: " + defaultName);
                }
            }
        );
    } else {
        showNotification("Không có flashcard nào hiện tại");
        console.log("No flashcards available to set as default");
    }
}

function checkStorageIntegrity() {
    console.log("Checking storage integrity...");

    // Kiểm tra tất cả các keys quan trọng
    chrome.storage.local.get(["listFlashCards", "list_flashcard_id", "target_language"], function (result) {
        if (chrome.runtime.lastError) {
            console.error("Error checking storage integrity:", chrome.runtime.lastError);
            return;
        }

        console.log("Current storage state:", result);

        // Validate data integrity
        if (result.listFlashCards && result.list_flashcard_id) {
            const flashcardExists = result.listFlashCards.find((item) => item._id === result.list_flashcard_id.id);
            if (!flashcardExists) {
                console.warn("Selected flashcard no longer exists in the list, will reset to default");
                showNotification("Dữ liệu không nhất quán được phát hiện - flashcard đã chọn không còn tồn tại");
                // Remove invalid selection
                chrome.storage.local.remove(["list_flashcard_id"], function () {
                    if (chrome.runtime.lastError) {
                        console.error("Error removing invalid flashcard selection:", chrome.runtime.lastError);
                    }
                });
            }
        }

        // Set default target language if missing
        if (!result.target_language) {
            chrome.storage.local.set({ target_language: "english" }, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error setting default target_language:", chrome.runtime.lastError);
                } else {
                    console.log("Set default target_language to english");
                }
            });
        }

        // Check if we have critical data missing
        if (!result.listFlashCards || result.listFlashCards.length === 0) {
            showNotification("Không tìm thấy dữ liệu flashcard. Hãy thử làm mới hoặc khôi phục dữ liệu.");
        }
    });
}
