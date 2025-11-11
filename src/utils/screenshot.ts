const SCREENSHOT_API_KEY = 'CWBFGKC-SQD4C52-JZEKGZ8-JZXWBZ3';

export const takeScreenshot = async (url: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://shot.screenshotapi.net/screenshot?token=${SCREENSHOT_API_KEY}&url=${encodeURIComponent(url)}&output=json&file_type=png&wait_for_event=load`
    );

    if (!response.ok) {
      throw new Error('Screenshot API request failed');
    }

    const data = await response.json();
    return data.screenshot;
  } catch (error) {
    console.error('Screenshot error:', error);
    throw error;
  }
};
