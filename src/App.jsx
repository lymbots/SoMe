import { useState } from 'react'

function App() {
  const [platform, setPlatform] = useState('Facebook')
  const [length, setLength] = useState('Kort')
  const [tones, setTones] = useState([])
  const [inputText, setInputText] = useState('')
  const [output, setOutput] = useState('')
  const [csvData, setCsvData] = useState(null)
  const [columns, setColumns] = useState([])
  const [selectedColumn, setSelectedColumn] = useState('')
  const [loading, setLoading] = useState(false)

  const handleToneChange = (tone) => {
    setTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    )
  }

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      let obj = {}
      headers.forEach((h, i) => (obj[h] = values[i]))
      return obj
    })
    return { headers, rows }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result
      const { headers, rows } = parseCSV(text)
      setColumns(headers)
      setCsvData(rows)

      if (headers.includes('ad_creative_bodies')) {
        setSelectedColumn('ad_creative_bodies')
      } else {
        setSelectedColumn(headers[0] || '')
      }
    }
    reader.readAsText(file)
  }

  const getSelectedColumnText = () => {
    if (!csvData || !selectedColumn) return ''
    return csvData.map(row => row[selectedColumn]).filter(Boolean).join('\n')
  }

  const generatePost = async () => {
    setLoading(true)
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    const oldPostsText = getSelectedColumnText()
    const prompt = `
Du er en social media-skribent. Brug brugerens tidligere opslag (nedenfor) til at efterligne deres stil.
Generer et ${length.toLowerCase()} opslag til ${platform}, med følgende tone: ${tones.join(', ')}.
Det skal handle om: "${inputText}"

Tidligere opslag:
${oldPostsText}
`

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      })
      const data = await res.json()
      setOutput(data.choices?.[0]?.message?.content || 'Ingen svar.')
    } catch (err) {
      setOutput('Der skete en fejl: ' + err.message)
    }
    setLoading(false)
  }

  const buttonStyle = (active) => ({
    padding: '10px 22px',
    marginRight: 12,
    marginBottom: 12,
    borderRadius: 30,
    border: '2px solid',
    borderColor: active ? '#1877F2' : '#cbd4db',
    backgroundColor: active ? '#1877F2' : 'transparent',
    color: active ? 'white' : '#555',
    fontWeight: active ? '700' : '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    userSelect: 'none',
    boxShadow: active ? '0 4px 12px rgba(24, 119, 242, 0.4)' : 'none',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        padding: 0,
        margin: 0,
      }}
    >
      {/* Topbar */}
      <header
        style={{
          backgroundColor: '#1877F2',
          color: 'white',
          padding: '14px 24px',
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: 1,
          boxShadow: '0 2px 8px rgb(24 119 242 / 0.6)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        📱 Opslag-generator
      </header>

      {/* Container */}
      <main
        style={{
          maxWidth: 620,
          margin: '40px auto',
          backgroundColor: 'white',
          borderRadius: 14,
          boxShadow: '0 12px 25px rgb(0 0 0 / 0.1)',
          padding: '30px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Upload */}
        <section>
          <label
            htmlFor="csvUpload"
            style={{
              display: 'block',
              fontWeight: '700',
              fontSize: 16,
              marginBottom: 12,
              color: '#222',
              cursor: 'pointer',
            }}
          >
            Upload dine gamle opslag (CSV-fil)
          </label>
          <input
            type="file"
            id="csvUpload"
            accept=".csv"
            onChange={handleFileChange}
            style={{
              borderRadius: 8,
              padding: '12px 14px',
              border: '1px solid #ccc',
              width: '100%',
              cursor: 'pointer',
              fontSize: 15,
              backgroundColor: '#fafafa',
            }}
          />
        </section>

        {csvData && (
          <>
            {/* Kolonnevalg, kun hvis ikke ad_creative_bodies */}
            {selectedColumn !== 'ad_creative_bodies' && (
              <section>
                <label
                  htmlFor="columnSelect"
                  style={{
                    fontWeight: '700',
                    fontSize: 16,
                    marginBottom: 10,
                    color: '#222',
                    display: 'block',
                  }}
                >
                  Vælg kolonne med opslag:
                </label>
                <select
                  id="columnSelect"
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #ccc',
                    fontSize: 15,
                  }}
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {/* Platform toggle */}
            <section>
              <label
                style={{
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 12,
                  color: '#222',
                  display: 'block',
                }}
              >
                Vælg medie:
              </label>
              {['Facebook', 'Instagram', 'LinkedIn'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  style={buttonStyle(platform === p)}
                  aria-pressed={platform === p}
                >
                  {p}
                </button>
              ))}
            </section>

            {/* Længde toggle */}
            <section>
              <label
                style={{
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 12,
                  color: '#222',
                  display: 'block',
                }}
              >
                Vælg længde:
              </label>
              {['Kort', 'Mellem', 'Lang'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  style={buttonStyle(length === l)}
                  aria-pressed={length === l}
                >
                  {l}
                </button>
              ))}
            </section>

            {/* Tone checkboxes */}
            <section>
              <label
                style={{
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 12,
                  color: '#222',
                  display: 'block',
                }}
              >
                Vælg tone (flere kan vælges):
              </label>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {['Seriøs', 'Optimistisk', 'Bekymret', 'Inspirerende'].map((tone) => (
                  <label
                    key={tone}
                    style={{
                      userSelect: 'none',
                      cursor: 'pointer',
                      fontWeight: tones.includes(tone) ? '700' : '500',
                      color: tones.includes(tone) ? '#1877F2' : '#444',
                      border: tones.includes(tone) ? '2px solid #1877F2' : '2px solid #ccc',
                      padding: '6px 14px',
                      borderRadius: 22,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tones.includes(tone)}
                      onChange={() => handleToneChange(tone)}
                      style={{ cursor: 'pointer' }}
                    />
                    {tone}
                  </label>
                ))}
              </div>
            </section>

            {/* Input text */}
            <section>
              <label
                htmlFor="inputText"
                style={{ fontWeight: '700', fontSize: 16, color: '#222', marginBottom: 8, display: 'block' }}
              >
                Indhold / idéer til opslag:
              </label>
              <textarea
                id="inputText"
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Skriv hvad opslaget skal handle om..."
                style={{
                  width: '100%',
                  borderRadius: 14,
                  border: '1px solid #ccc',
                  padding: '14px 18px',
                  fontSize: 16,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxShadow: 'inset 0 1px 3px rgb(0 0 0 / 0.1)',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1877F2')}
                onBlur={(e) => (e.target.style.borderColor = '#ccc')}
              />
            </section>

            {/* Generate button */}
            <button
              onClick={generatePost}
              disabled={loading || !inputText || tones.length === 0}
              style={{
                marginTop: 12,
                backgroundColor: loading ? '#a5c1fa' : '#1877F2',
                border: 'none',
                color: 'white',
                fontWeight: '700',
                padding: '14px 0',
                fontSize: 18,
                borderRadius: 30,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: loading ? 'none' : '0 6px 15px rgb(24 119 242 / 0.5)',
                transition: 'background-color 0.3s ease',
              }}
              aria-busy={loading}
            >
              {loading ? 'Genererer...' : 'Generer opslag'}
            </button>

            {/* Output */}
            {output && (
              <section
                style={{
                  marginTop: 24,
                  padding: 20,
                  backgroundColor: '#f6f7fb',
                  borderRadius: 16,
                  borderLeft: '6px solid #1877F2',
                  whiteSpace: 'pre-wrap',
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: '#222',
                  boxShadow: '0 2px 10px rgb(24 119 242 / 0.15)',
                  userSelect: 'text',
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 14, color: '#1877F2' }}>
                  💬 Forslag til opslag:
                </h3>
                {output}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
