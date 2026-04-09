type ShowDetailHeroProps = {
  title: string;
  sellerName: string;
  description: string;
  status: string;
  viewers: number;
  coverImage: string;
};

export function ShowDetailHero(props: ShowDetailHeroProps) {
  return (
    <section
      className="hero-card cover-card"
      style={{
        backgroundImage: `linear-gradient(rgba(24, 16, 11, 0.45), rgba(24, 16, 11, 0.7)), url(${props.coverImage})`
      }}
    >
      <p className="eyebrow light">Live room</p>
      <h1 className="light">{props.title}</h1>
      <p className="light">
        Hosted by {props.sellerName} · {props.status} · {props.viewers} viewers
      </p>
      <p className="light">{props.description}</p>
    </section>
  );
}
