type LiveShowCardProps = {
  title: string;
  seller: string;
  status: string;
  viewers: number;
  highlight: string;
};

export function LiveShowCard(props: LiveShowCardProps) {
  return (
    <article className="show-card">
      <div className="show-header">
        <p className="pill">
          <span className="dot" />
          {props.status}
        </p>
        <span className="show-meta">{props.viewers} viewers</span>
      </div>

      <h3>{props.title}</h3>
      <p className="show-meta">Hosted by {props.seller}</p>

      <div className="show-footer">
        <p>{props.highlight}</p>
        <a className="button" href="/technical-outline">
          Inspect flow
        </a>
      </div>
    </article>
  );
}
