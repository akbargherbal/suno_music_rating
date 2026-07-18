import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AudioPlayer from './AudioPlayer';

describe('AudioPlayer', () => {
  it('shows a "not loaded" placeholder and no controls when src is null', () => {
    render(<AudioPlayer src={null} filename="song_a.mp3" version="A" />);

    expect(screen.getByText(/الملف الصوتي لهذه النسخة غير محمل/)).toBeInTheDocument();
    expect(screen.queryByTitle('تشغيل')).not.toBeInTheDocument();
  });

  it('renders playback controls once a src is provided', () => {
    render(<AudioPlayer src="blob:test" filename="song_a.mp3" version="A" />);

    expect(screen.getByTitle('تشغيل')).toBeInTheDocument();
    expect(screen.getByTitle('إعادة للبداية')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
  });

  it('displays the file extension derived from the filename', () => {
    render(<AudioPlayer src="blob:test" filename="track_seven.wav" version="B" />);
    expect(screen.getByText('WAV')).toBeInTheDocument();
  });

  it('falls back to "MP3" when the filename has no extension', () => {
    render(<AudioPlayer src="blob:test" filename="track_without_extension" version="A" />);
    expect(screen.getByText('MP3')).toBeInTheDocument();
  });

  it('toggles the play/pause button label when the audio element fires play/pause', () => {
    // jsdom's HTMLMediaElement.play()/pause() are stubs that don't dispatch
    // real "play"/"pause" events, so we simulate what the browser would do
    // and assert the component reacts to those events correctly.
    const { container } = render(<AudioPlayer src="blob:test" filename="song_a.mp3" version="A" />);
    const audioEl = container.querySelector('audio') as HTMLAudioElement;

    expect(screen.getByTitle('تشغيل')).toBeInTheDocument();

    act(() => {
      audioEl.dispatchEvent(new Event('play'));
    });
    expect(screen.getByTitle('إيقاف مؤقت')).toBeInTheDocument();

    act(() => {
      audioEl.dispatchEvent(new Event('pause'));
    });
    expect(screen.getByTitle('تشغيل')).toBeInTheDocument();
  });

  it('calling togglePlay does not throw when src is present', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer src="blob:test" filename="song_a.mp3" version="A" />);
    await expect(user.click(screen.getByTitle('تشغيل'))).resolves.not.toThrow();
  });

  it('lets the user pick a different playback speed', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer src="blob:test" filename="song_a.mp3" version="A" />);

    const speedButton = screen.getByText('1.5x');
    await user.click(speedButton);

    // The active speed button gets the bold/highlighted styling class.
    expect(speedButton.className).toMatch(/font-bold/);
  });

  it('mutes and unmutes via the mute button', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer src="blob:test" filename="song_a.mp3" version="A" />);

    const muteButton = screen.getByTitle('كتم الصوت');
    await user.click(muteButton);

    expect(screen.getByTitle('إلغاء كتم الصوت')).toBeInTheDocument();
  });

  it('calls onTimeUpdate as the underlying audio element reports progress', () => {
    const onTimeUpdate = vi.fn();
    const { container } = render(
      <AudioPlayer src="blob:test" filename="song_a.mp3" version="A" onTimeUpdate={onTimeUpdate} />
    );

    const audioEl = container.querySelector('audio') as HTMLAudioElement;
    Object.defineProperty(audioEl, 'currentTime', { value: 12.5, configurable: true });
    act(() => {
      audioEl.dispatchEvent(new Event('timeupdate'));
    });

    expect(onTimeUpdate).toHaveBeenCalledWith(12.5);
  });
});