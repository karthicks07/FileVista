
import { useRef, useState } from "react";
import "./MediaPreview.css";

interface MediaPreviewProps {
    url: string;
    fileName: string;
    mediaType: "video" | "audio";
}

export function MediaPreview({
    url,
    fileName,
    mediaType
}: MediaPreviewProps) {
    const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const isVideo = mediaType === "video";

    const handlePlaybackRateChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const rate = Number(event.target.value);

        setPlaybackRate(rate);

        if (mediaRef.current) {
            mediaRef.current.playbackRate = rate;
        }
    };

    const handleLoaded = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    if (error) {
        return (
            <div className="ufv-media-error">
                <div className="ufv-media-error-icon">!</div>
                <h3>Unable to play media</h3>
                <p>
                    The {mediaType} file could not be played. Check the file
                    format, server response, and browser codec support.
                </p>
                <span className="ufv-media-error-filename">
                    {fileName}
                </span>
            </div>
        );
    }

    return (
        <div className={`ufv-media-viewer ufv-${mediaType}-viewer`}>
            <div className="ufv-media-toolbar">
                <div className="ufv-media-file-info">
                    <span className="ufv-media-type-badge">
                        {isVideo ? "VIDEO" : "AUDIO"}
                    </span>
                    <span className="ufv-media-filename" title={fileName}>
                        {fileName}
                    </span>
                </div>

                <div className="ufv-media-speed-control">
                    <label htmlFor="ufv-playback-speed">
                        Speed
                    </label>

                    <select
                        id="ufv-playback-speed"
                        value={playbackRate}
                        onChange={handlePlaybackRateChange}
                    >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1">1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                    </select>
                </div>
            </div>

            <div className="ufv-media-content">
                {loading && (
                    <div className="ufv-media-loading">
                        Loading {mediaType}...
                    </div>
                )}

                {isVideo ? (
                    <video
                        ref={mediaRef}
                        className="ufv-video-element"
                        controls
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={handleLoaded}
                        onCanPlay={handleLoaded}
                        onError={handleError}
                    >
                        <source src={url} />
                        Your browser does not support video playback.
                    </video>
                ) : (
                    <div className="ufv-audio-player">
                        <div className="ufv-audio-icon">
                            <span>♫</span>
                        </div>

                        <div className="ufv-audio-information">
                            <h3>{fileName}</h3>
                            <p>Audio playback</p>
                        </div>

                        <audio
                            ref={mediaRef}
                            className="ufv-audio-element"
                            controls
                            preload="metadata"
                            onLoadedMetadata={handleLoaded}
                            onCanPlay={handleLoaded}
                            onError={handleError}
                        >
                            <source src={url} />
                            Your browser does not support audio playback.
                        </audio>
                    </div>
                )}
            </div>
        </div>
    );
}
