import { useState, useEffect } from 'react'

function App() {
  const [persons, setPersons] = useState([])
  const [selectedPerson, setSelectedPerson] = useState('')
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

  // Hent personer ved mount
  useEffect(() => {
    async function fetchPersons() {
      try {
        const res = await fetch('http://localhost:3001/api/persons')
        const data = await res.json()
        setPersons(data.persons)
        if (data.persons.length > 0) setSelectedPerson(data.persons[0])
      } catch (error) {
        console.error('Fejl ved hentning af personer:', error)
      }
    }
    fetchPersons()
  }, [])

  // Hent CSV-data når person ændres
  useEffect(() => {
    if (!selectedPerson) return
    async function fetchCsvData() {
      try {
        const res = await fetch(`http://localhost:3001/api/getData?person=${selectedPerson}`)
        const data = await res.json()
        setColumns(data.headers)
        setCsvData(data.rows)
        if (data.headers.includes('ad_creative_bodies')) {
          setSelectedColumn('ad_creative_bodies')
        } else {
          setSelectedColumn(data.headers[0] || '')
        }
      } catch (error) {
        setCsvData(null)
        setColumns([])
        setSelectedColumn('')
        console.error('Fejl ved hentning af CSV-data:', error)
      }
    }
    fetchCsvData()
  }, [selectedPerson])

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
        {/* Personvalg */}
        <section>
          <label
            htmlFor="personSelect"
            style={{
              fontWeight: '700',
              fontSize: 16,
              marginBottom: 10,
              color: '#222',
              display: 'block',
            }}
          >
            Vælg politiker:
          </label>
          <select
            id="personSelect"
            value={selectedPerson}
            onChange={e => setSelectedPerson(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #ccc',
              fontSize: 15,
            }}
          >
            {persons.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </section>

        {/* Fjernet upload input */}

        {!csvData && (
          <p style={{ fontSize: 16, color: '#555' }}>
            Henter tidligere opslag fra server...
          </p>
        )}

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

            {/* Input tekst */}
            <section>
              <label
                htmlFor="inputText"
                style={{
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 10,
                  color: '#222',
                  display: 'block',
                }}
              >
                Emne / idé til opslag:
              </label>
              <textarea
                id="inputText"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                placeholder="Skriv her..."
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid #ccc',
                  fontSize: 16,
                  padding: 14,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </section>

            {/* Generate knap */}
            <section>
              <button
                onClick={generatePost}
                disabled={loading || !inputText.trim()}
                style={{
                  padding: '14px 36px',
                  backgroundColor: '#1877F2',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: 16,
                  borderRadius: 30,
                  border: 'none',
                  cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputText.trim() ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(24,119,242,0.6)',
                  transition: 'background-color 0.3s ease',
                }}
              >
                {loading ? 'Genererer...' : 'Generer opslag'}
              </button>
            </section>

            {/* Output */}
            <section>
              <label
                style={{
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 10,
                  color: '#222',
                  display: 'block',
                }}
              >
                Genereret opslag:
              </label>
              <pre
                style={{
                  backgroundColor: '#f9f9f9',
                  padding: 20,
                  borderRadius: 14,
                  minHeight: 120,
                  whiteSpace: 'pre-wrap',
                  fontSize: 15,
                  color: '#333',
                }}
              >
                {output}
              </pre>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
