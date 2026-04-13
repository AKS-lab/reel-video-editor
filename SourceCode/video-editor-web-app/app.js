const button = document.getElementById("checkBtn");
const status = document.getElementById("status");

function setStatus(message) {
  if (status) {
    status.textContent = message;
  }
}

function checkRuntime() {
  const workerSupport = typeof Worker !== "undefined";
  const indexedDbSupport = typeof indexedDB !== "undefined";
  const mediaCapabilitiesSupport =
    typeof navigator !== "undefined" && "mediaCapabilities" in navigator;

  setStatus(
    [
      "Web setup ready.",
      `Worker support: ${workerSupport}`,
      `IndexedDB support: ${indexedDbSupport}`,
      `MediaCapabilities support: ${mediaCapabilitiesSupport}`
    ].join("\n")
  );
}

if (button) {
  button.addEventListener("click", checkRuntime);
}

setStatus("Click 'Check Runtime' to validate browser capabilities.");
