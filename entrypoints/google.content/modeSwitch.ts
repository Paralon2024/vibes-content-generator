import { sleep, nativeClick, findButtonByTextSubstring } from './domUtils';

// Try to switch the Google Flow interface to "Video" mode if it is in "Image" mode
export async function switchToVideoMode(): Promise<boolean> {
  // Find the settings button, which usually says "Video | x1" or "Image"
  const settingsBtn =
    findButtonByTextSubstring('Video | x1') ||
    findButtonByTextSubstring('Video') ||
    findButtonByTextSubstring('Image');

  if (!settingsBtn) return false;
  if (settingsBtn.textContent?.toLowerCase().includes('video')) return true; // Already in video mode

  await nativeClick(settingsBtn);
  await sleep(600);

  // In the popup that opens, find the tab/button whose exact label is "Video"
  const videoTab = findButtonByTextSubstring('Video', true);
  if (videoTab) {
    await nativeClick(videoTab);
    await sleep(600);
    // Click outside to close the menu if it remains open
    document.body.click();
    return true;
  }

  return false;
}
