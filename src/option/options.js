document.addEventListener("DOMContentLoaded", function () {
    const selectFlashcard = document.getElementById("sourceFlashcard");
    const sourceLanguage = document.getElementById("sourceLanguage");

    if (selectFlashcard) {
        chrome.storage.local.get(["listFlashCards"], function (result) {
            console.log(result.listFlashCards);
            const flashcardList = result.listFlashCards;
            if (flashcardList && flashcardList.length > 0) {
                selectFlashcard.innerHTML = "";
                flashcardList.forEach((item) => {
                    const option = document.createElement("option");
                    option.value = item._id;
                    option.textContent = `Tên: ${item.title} | Tổng: ${item.flashcards.length}`;
                    selectFlashcard.appendChild(option);
                });
            }
            chrome.storage.local.get(["list_flashcard_id"], function (result) {
                const selectedId = result.list_flashcard_id;
                if (selectedId) {
                    selectFlashcard.value = selectedId;
                } else {
                    selectFlashcard.value = flashcardList[0]._id;
                    chrome.storage.local.set({ list_flashcard_id: flashcardList[0]._id });
                }
            });
        });
        selectFlashcard.addEventListener("change", function (e) {
            const selectedId = e.target.value;
            chrome.storage.local.set({ list_flashcard_id: selectedId });
        });
    }
    if (sourceLanguage) {
        chrome.storage.local.get(["target_language"], function (result) {
            const selectedId = result.target_language;
            if (selectedId) {
                sourceLanguage.value = selectedId;
            } else {
                sourceLanguage.value = "en";
                chrome.storage.local.set({ target_language: "en" });
            }
        });
        sourceLanguage.addEventListener("change", function (e) {
            const selectedId = e.target.value;
            chrome.storage.local.set({ target_language: selectedId });
        });
    }
});
