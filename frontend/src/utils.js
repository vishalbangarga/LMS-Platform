/**
 * Extracts the YouTube video ID from various YouTube URL formats
 */
export const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Returns a high-quality thumbnail URL for a course.
 * If the provided URL is a YouTube link, it extracts the video ID and returns the YouTube thumbnail.
 * Otherwise, it returns the provided URL or a placeholder.
 */
export const getCourseThumbnail = (url) => {
    if (!url) return 'https://via.placeholder.com/400x200?text=Course';
    
    // Check if it's a YouTube URL
    const ytId = getYouTubeId(url);
    if (ytId) {
        // hqdefault is usually 480x360, maxresdefault is 1280x720
        return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    
    return url;
};
