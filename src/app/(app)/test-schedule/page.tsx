'use client';

import { useState } from 'react';

/**
 * Page de test temporaire pour tester la planification des emails.
 * Accessible à /test-schedule
 * 
 * SUPPRIMER CETTE PAGE APRÈS LES TESTS
 */
export default function TestSchedulePage() {
    const [campaignId, setCampaignId] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSchedule = async () => {
        if (!campaignId.trim()) {
            setError('Veuillez entrer un ID de campagne');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!response.ok) {
                setError(`Erreur ${response.status}: ${data.error || JSON.stringify(data)}`);
            } else {
                setResult(JSON.stringify(data, null, 2));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    const handleGetStats = async () => {
        if (!campaignId.trim()) {
            setError('Veuillez entrer un ID de campagne');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
                method: 'GET',
            });

            const data = await response.json();

            if (!response.ok) {
                setError(`Erreur ${response.status}: ${data.error || JSON.stringify(data)}`);
            } else {
                setResult(JSON.stringify(data, null, 2));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1rem' }}>🧪 Test Email Scheduling</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
                Page temporaire pour tester la Story 5.4
            </p>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    ID de la campagne (doit être en statut RUNNING) :
                </label>
                <input
                    type="text"
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    placeholder="ex: cml9ttbus000w134e7qcfxay3"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={handleSchedule}
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#4F46E5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? 'Chargement...' : '📅 Planifier les emails'}
                </button>

                <button
                    onClick={handleGetStats}
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? 'Chargement...' : '📊 Voir les stats'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #EF4444',
                    borderRadius: '4px',
                    color: '#B91C1C',
                    marginBottom: '1rem',
                }}>
                    ❌ {error}
                </div>
            )}

            {result && (
                <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>✅ Résultat :</h3>
                    <pre style={{
                        padding: '1rem',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '13px',
                    }}>
                        {result}
                    </pre>
                </div>
            )}

            <hr style={{ margin: '2rem 0' }} />

            <div style={{ color: '#666', fontSize: '14px' }}>
                <strong>Instructions :</strong>
                <ol>
                    <li>Copiez l'ID d'une campagne depuis Prisma Studio (table <code>Campaign</code>)</li>
                    <li>Assurez-vous que la campagne est en statut <code>RUNNING</code></li>
                    <li>Cliquez sur "Planifier les emails"</li>
                    <li>Vérifiez dans Prisma Studio (table <code>ScheduledEmail</code>) que les lignes ont été créées</li>
                </ol>
            </div>
        </div>
    );
}
