// Video.jsx: a YouTube video in a 16:9 frame, from youtube-nocookie.com (YouTube's privacy-enhanced mode: no
// tracking cookies until the visitor plays it), loaded lazily.
export default function Video({ id, title, caption }) {
  return (
    <figure className="video">
      <div className="video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
