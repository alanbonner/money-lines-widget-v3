
import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const RUN_URL = process.env.NEXT_PUBLIC_RUNMONEYLINE_URL;
const CSV_URL = process.env.NEXT_PUBLIC_SHEET_CSV_URL;

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const [headerLine, ...rows] = lines;
  const headers = headerLine.split(',');
  const idx = (k) => headers.indexOf(k);
  return rows.map(l => {
    const cols = l.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    return {
      id: cols[idx('id')],
      name: cols[idx('name')],
      synopsis: cols[idx('synopsis')],
      template: cols[idx('template')],
      objectives: cols[idx('objectives')],
    };
  });
}

export default function App() {
  const [frameworks, setFrameworks] = useState([]);
  const [objective, setObjective] = useState('');
  const [selected, setSelected] = useState('');
  const [keyword, setKeyword] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(CSV_URL)
      .then(r => r.text())
      .then(t => setFrameworks(parseCSV(t)))
      .catch(() => alert('Failed to load frameworks list'));
  }, []);

  const objectives = [...new Set(frameworks.flatMap(f => (f.objectives || '').split('|').map(o => o.trim()).filter(Boolean)))];

  const filtered = objective ? frameworks.filter(f => f.objectives?.includes(objective)) : frameworks;

  const handleGenerate = async () => {
    if (!selected || !keyword) return alert('Select a framework and enter a keyword first.');
    setOutput('');
    setLoading(true);
const res = await fetch(RUN_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY   // ⬅️ add this
  },
  body: JSON.stringify({
    frameworkId: selected,
    answers: { keyword },
    userId: 'frontend-demo',
    plan: 'ALLIN'
  })
});    
    if (!res.ok || !res.body) { setLoading(false); return alert('Error from server'); }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while(true) {
      const {value, done} = await reader.read();
      if(done) break;
      setOutput(prev => prev + decoder.decode(value));
    }
    setLoading(false);
  };

  return (
    <div style={{fontFamily:'sans-serif',padding:20,maxWidth:800,margin:'0 auto'}}>
      <h1>Money Lines Generator</h1>

      <h3>Objective</h3>
      {objectives.map(o=>(
        <button key={o} onClick={()=>setObjective(o)}
          style={{margin:4,padding:'6px 10px',background:o===objective?'#006e6e':'#eee',color:o===objective?'#fff':'#000',border:'none',borderRadius:4}}>
          {o}
        </button>
      ))}
      <button onClick={()=>setObjective('')} style={{margin:4}}>All</button>

      <h3 style={{marginTop:20}}>Framework</h3>
      <select value={selected} onChange={e=>setSelected(e.target.value)} style={{width:'100%',padding:8}}>
        <option value="">Select...</option>
        {filtered.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
      </select>

      <h3>Keyword / Pain-point</h3>
      <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="e.g. Forex Trading" style={{width:'100%',padding:8}} />

      <button onClick={handleGenerate} disabled={loading} style={{marginTop:12,padding:12,width:'100%',background:'#022543',color:'#fff',border:'none',borderRadius:4}}>
        {loading ? 'Generating…' : 'Generate'}
      </button>

      <pre style={{whiteSpace:'pre-wrap',background:'#f4f4f4',padding:10,marginTop:20,minHeight:160}}>{output}</pre>
    </div>
  );
}
