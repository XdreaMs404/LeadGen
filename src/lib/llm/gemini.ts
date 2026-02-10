/**
 * Vertex AI Gemini Provider
 * 
 * Uses Gemini 2.0 Flash via Vertex AI for email generation and improvement.
 * Story 4.4: AI Email Assistant
 */

import { VertexAI } from '@google-cloud/vertexai';
import {
    LLMProvider,
    EmailResult,
    LLMError,
    GENERATION_TIMEOUT_MS,
    OpenerContext
} from './types';

// ============================================================================
// System Prompt - Expert Email Copywriter
// ============================================================================

const SYSTEM_PROMPT = `Tu es un expert en copywriting B2B et prospection email avec 15 ans d'expérience.

## TON OBJECTIF
Rédiger des emails de prospection qui :
- Captent l'attention dès la première ligne
- Créent un sentiment d'urgence subtile
- Génèrent des réponses et des rendez-vous
- Respectent les bonnes pratiques anti-spam

## STRUCTURE D'UN EXCELLENT EMAIL B2B

### OBJET (Subject Line)
- Maximum 50 caractères
- Personnalisé avec le nom/entreprise quand possible
- Questions ou curiosité gap fonctionnent mieux
- PAS de mots spam (gratuit, urgent, offre, promo)
- PAS de ponctuation excessive

### ACCROCHE (Première phrase)
- Personnalisée, montre que tu connais le prospect
- Référence à leur entreprise/secteur si possible
- PAS de "J'espère que vous allez bien"

### CORPS
- Maximum 100-150 mots au total
- Identifier UN problème précis qu'ils ont
- Proposer UNE solution claire (pas de liste exhaustive)
- Preuve sociale si possible (résultats clients)
- Phrases courtes, paragraphes aérés

### CALL-TO-ACTION
- UN seul CTA clair et précis
- Micro-engagement préféré ("Seriez-vous ouvert à...")
- Proposer un créneau ou une alternative simple

### SIGNATURE
Termine par "Cordialement," sans autre formalité.

## VARIABLES DISPONIBLES
Tu DOIS utiliser ces variables EXACTEMENT comme écrit (avec underscores) :
- {{first_name}} : Prénom du prospect
- {{last_name}} : Nom de famille
- {{company}} : Nom de l'entreprise
- {{title}} : Poste/fonction
- {{email}} : Email

⚠️ IMPORTANT: Les variables sont en snake_case avec des underscores, PAS en camelCase !
✅ Correct: {{first_name}}, {{company}}
❌ Incorrect: {{firstName}}, {{Company}}

## FORMAT DE RÉPONSE
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après :
{"subject": "L'objet de l'email", "body": "Le corps de l'email en HTML simple"}

Le corps peut contenir des balises HTML simples : <p>, <br>, <strong>, <em>
`;

// ============================================================================
// Prompts for each mode
// ============================================================================

const GENERATE_PROMPT = `${SYSTEM_PROMPT}

## TA MISSION
L'utilisateur va te décrire le mail qu'il veut. Génère un email de prospection PARFAIT en suivant toutes les règles ci-dessus.

DEMANDE DE L'UTILISATEUR :
`;

const IMPROVE_PROMPT = `${SYSTEM_PROMPT}

## TA MISSION
L'utilisateur te donne un email existant. Tu dois l'améliorer en :
- Gardant le même message et objectif
- Améliorant la structure et le flow
- Rendant l'accroche plus percutante
- Raccourcissant si trop long
- Corrigeant les erreurs de style
- Préservant les variables {{...}} existantes

Si des variables sont mal formatées, corrige-les vers le bon format (snake_case).

EMAIL ORIGINAL À AMÉLIORER :
`;

const OPENER_SYSTEM_PROMPT = `Tu es un expert en social selling.
TON OBJECTIF: Rédiger une phrase d'accroche (opener) hyper-personnalisée pour démarrer une conversation LinkedIn ou Email.
RÈGLES:
- Max 2 phrases.
- Ton simple, conversationnel, pas "vendeur".
- Doit faire référence au contexte du prospect (titre, entreprise).
- PAS de "J'espère que vous allez bien".
- Réponds UNIQUEMENT par le texte de l'opener.`;

// ============================================================================
// Vertex AI Gemini Provider
// ============================================================================

class GeminiProvider implements LLMProvider {
    private client: VertexAI | null = null;
    private modelName = 'gemini-2.0-flash-001';
    private projectId = process.env.GOOGLE_CLOUD_PROJECT || 'leadgen-484215';
    private location = process.env.GOOGLE_CLOUD_LOCATION || 'europe-west1';

    private getClient(): VertexAI {
        if (!this.client) {
            if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                process.env.GOOGLE_APPLICATION_CREDENTIALS = './credentials/vertex-ai-service-account.json';
            }

            this.client = new VertexAI({
                project: this.projectId,
                location: this.location,
            });
        }
        return this.client;
    }

    private async callLLM(prompt: string): Promise<EmailResult> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new LLMError(
                    'GENERATION_TIMEOUT',
                    'La génération a pris trop de temps. Réessayez.'
                ));
            }, GENERATION_TIMEOUT_MS);
        });

        try {
            const client = this.getClient();
            const model = client.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    temperature: 0.9,  // Slightly higher for more creative emails
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 1500,
                },
            });

            const generatePromise = model.generateContent(prompt);
            const result = await Promise.race([generatePromise, timeoutPromise]);

            const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (!text) {
                throw new LLMError('PROVIDER_ERROR', 'La réponse du modèle est vide');
            }

            // Extract JSON from response (handle markdown code blocks)
            let jsonStr = text;

            // Remove markdown code blocks if present
            const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonBlockMatch) {
                jsonStr = jsonBlockMatch[1].trim();
            }

            // Find JSON object
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new LLMError('PROVIDER_ERROR', 'Format de réponse invalide');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (!parsed.subject || !parsed.body) {
                throw new LLMError('PROVIDER_ERROR', 'Réponse incomplète du modèle');
            }

            // Clean up the body - ensure proper HTML formatting
            let body = parsed.body;

            // If body doesn't have HTML tags, wrap paragraphs
            if (!body.includes('<p>') && !body.includes('<br')) {
                body = body
                    .split('\n\n')
                    .filter((p: string) => p.trim())
                    .map((p: string) => `<p>${p.trim()}</p>`)
                    .join('');
            }

            return {
                subject: parsed.subject.trim(),
                body: body,
            };
        } catch (error) {
            if (error instanceof LLMError) {
                throw error;
            }

            if (error instanceof Error && error.message.includes('429')) {
                throw new LLMError(
                    'RATE_LIMIT_EXCEEDED',
                    'Limite de requêtes atteinte. Réessayez dans quelques minutes.',
                    error
                );
            }

            if (error instanceof SyntaxError) {
                throw new LLMError(
                    'PROVIDER_ERROR',
                    'Le modèle a renvoyé une réponse mal formatée. Réessayez.',
                    error
                );
            }

            throw new LLMError(
                'PROVIDER_ERROR',
                `Erreur de génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                error
            );
        }
    }

    async generateEmail(prompt: string): Promise<EmailResult> {
        const fullPrompt = `${GENERATE_PROMPT}\n${prompt}`;
        return this.callLLM(fullPrompt);
    }

    async improveEmail(subject: string, body: string): Promise<EmailResult> {
        // Strip HTML for cleaner input to LLM
        const cleanBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        const fullPrompt = `${IMPROVE_PROMPT}
Objet: ${subject}

Corps:
${cleanBody}`;
        return this.callLLM(fullPrompt);
    }

    async generateOpener(context: OpenerContext): Promise<string> {
        const prompt = `${OPENER_SYSTEM_PROMPT}

PROSPECT:
Prénom: ${context.prospectFirstName || 'le prospect'}
Nom: ${context.prospectLastName || ''}
Poste: ${context.prospectTitle || 'inconnu'}
Entreprise: ${context.prospectCompany || 'inconnue'}

Génère l'opener maintenant :`;

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new LLMError(
                    'GENERATION_TIMEOUT',
                    'La génération a pris trop de temps. Réessayez.'
                ));
            }, GENERATION_TIMEOUT_MS);
        });

        try {
            const client = this.getClient();
            const model = client.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    temperature: 0.8,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 150,
                },
            });

            const generatePromise = model.generateContent(prompt);
            const result = await Promise.race([generatePromise, timeoutPromise]);
            const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (!text) {
                throw new LLMError('PROVIDER_ERROR', 'La réponse du modèle est vide');
            }

            return text;

        } catch (error) {
            if (error instanceof LLMError) throw error;

            // Re-use error handling logic if possible, or just wrap
            if (error instanceof Error && error.message.includes('429')) {
                throw new LLMError('RATE_LIMIT_EXCEEDED', 'Limite de requêtes atteinte.', error);
            }

            throw new LLMError('PROVIDER_ERROR', 'Erreur de génération', error);
        }
    }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const geminiProvider = new GeminiProvider();
