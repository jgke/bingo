import React, { PropsWithChildren, useEffect, useState } from 'react';
import useFitText from "use-fit-text";
import pako from 'pako';
import { Base64 } from 'js-base64';

function range(hi: number) {
  return Array(hi).fill(0).map((_, i) => i);
}

function Cell({ children, selected, onClick }: PropsWithChildren<{selected: boolean, onClick(): void}>): React.ReactElement {
  const { fontSize, ref } = useFitText({maxFontSize: 500});
  return (
    <div className={`border-4 border-sky-800 ${selected ? 'bg-gray-400': 'bg-white'}`} onClick={onClick}>
      {/* now this is professional programming */}
      <span ref={ref} aria-hidden="true" className="absolute w-[16vw] h-[16vw] lg:w-32 lg:h-32 md:p-2 opacity-0 select-none -z-50" style={{ fontSize }}>{children}</span>
      <div className="w-[16vw] h-[16vw] lg:w-32 lg:h-32 flex flex-col grow items-center justify-center">
        <span className="text-sky-800 text-center md:p-2" style={{ fontSize }}>{children}</span>
      </div>
    </div>
  );
}

function Row({ children }: PropsWithChildren<{}>): React.ReactElement {
  return <span className="flex">{children}</span>
}

function Grid({ width, height, entries, selected, onClick }: { width: number, height: number, entries: string[], selected: {[key: string]: boolean}, onClick(coord: string): void }): React.ReactElement {
  console.log(selected);
  return <div className="flex flex-col border-4 border-sky-800">
    {
      range(height).map(y => (
        <Row key={`${y}`}>{range(width).map(x => (
          <Cell key={`${x},${y}_${entries[y*width+x]}`}
          selected={selected[`${x},${y}`]}
          onClick={() => {console.log(x, y); onClick(`${x},${y}`)}}>{entries[y * width + x] || ""}</Cell>
        ))}</Row>
      ))
    }
  </div>
}

function shuffleArray(inp: string[]) {
  const array = inp.slice(0);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadUrlState(): {title?: string, centercell?: string, entries?: string} | undefined {
  const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
  let value = params.state;
  if(value) {
    const deflated = Base64.toUint8Array(value);
    const inflated = pako.inflate(deflated);
    const jsonString = new TextDecoder().decode(inflated);
    return JSON.parse(jsonString);
  }
}

function copyUrl(data: {title: string, centercell: string, entries: string}) {
  const compressed = pako.deflate(JSON.stringify(data));
  const base64 = Base64.fromUint8Array(compressed);

  const url = new URL(window.location.toString());
  url.searchParams.set("state", base64);
  navigator.clipboard.writeText(url.toString());
}

function App() {
  const [title, setTitle] = useState("");
  const [centercell, setCentercell] = useState("");
  const [entries, setEntries] = useState("");
  const [selected, setSelected] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const initialState = loadUrlState();
    console.log("Loaded state ", initialState)
    setTitle(initialState?.title || "Bingo");
    setCentercell(initialState?.centercell || "FREE");
    setEntries(initialState?.entries || range(24).map(i => `${i+1}`).join("\n"));
  }, [])

  const entryLines = entries.split("\n");

  const gridSize = Math.ceil(Math.sqrt(entryLines.length + 1));
  const gridSizeSquared = (gridSize * gridSize)
  const gridCells = entryLines.slice(0, gridSizeSquared / 2)
  .concat(centercell)
  .concat(entryLines.slice(gridSizeSquared / 2))

  const shuffle = () => {
    setEntries(shuffleArray(entryLines).join("\n"));
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-slate-900 flex justify-center p-4">
        <span className="text-white text-3xl font-bold">Bingo generator</span>
      </header>
      <main className="flex flex-col lg:flex-row h-full">
        <section className="lg:w-2/5 flex flex-col items-center bg-gray-400">
          <form className="flex flex-col w-4/5 h-full" onSubmit={e => e.preventDefault()}>
            <label className="flex flex-col mb-4">
              <span className="font-bold">Bingo title</span>
              <input type="text" className="rounded" value={title} onChange={e => setTitle(e.target.value)} />
            </label>

            <label className="flex flex-col mb-4">
              <span className="font-bold">Center cell text</span>
              <input type="text" className="rounded" value={centercell} onChange={e => setCentercell(e.target.value)} />
            </label>

            <label className="flex flex-col h-full">
              <span className="font-bold">Bingo entries separated with enter</span>
              <div className="w-full h-5/6">
                <textarea className="w-full p-1 h-full rounded" value={entries} onChange={e => setEntries(e.target.value)} />
              </div>
            </label>

            <button type="button" className="bg-white rounded mb-5 p-4" onClick={shuffle}>Shuffle</button>

            <button type="button" className="bg-white rounded mb-5 p-4" onClick={() => copyUrl({title, centercell, entries})}>Copy bingo url to clipboard</button>
          </form>
        </section>

        <section className="flex flex-col grow items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-200">
          <h2 className="font-sans lg:text-5xl font-bold lg:leading-[4rem]">{title}</h2>
          <Grid width={gridSize} height={gridSize} entries={gridCells}  selected={selected} onClick={coord => setSelected({...selected, [coord]: !selected[coord]})} />
        </section>
      </main>
    </div>
  );
}

export default App;
