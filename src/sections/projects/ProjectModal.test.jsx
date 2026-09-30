jest.mock('./projectMedia', () => ({
  getProjectImageAlt: jest.fn(() => ''),
}));

import { copyShareUrl } from './ProjectModal';

describe('project video share fallback', () => {
  const originalClipboard = navigator.clipboard;
  const originalExecCommand = document.execCommand;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
    document.execCommand = originalExecCommand;
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('copies with the Clipboard API when permission is available', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await copyShareUrl('https://portfolio.test/#projects');

    expect(writeText).toHaveBeenCalledWith('https://portfolio.test/#projects');
  });

  test('falls back to a temporary textarea when Clipboard API access is denied', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    document.execCommand = jest.fn().mockReturnValue(true);

    await copyShareUrl('https://portfolio.test/#projects');

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });
});
