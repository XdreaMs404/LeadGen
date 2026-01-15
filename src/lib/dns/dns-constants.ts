/**
 * DNS Error Messages in French
 *
 * All user-facing messages for DNS validation errors.
 */

export const DNS_ERROR_MESSAGES = {
    // Generic errors
    TIMEOUT: 'Le serveur DNS n\'a pas répondu à temps. Réessayez dans quelques instants.',
    SERVER_ERROR: 'Le serveur DNS a rencontré une erreur. Réessayez plus tard.',
    UNKNOWN_ERROR: 'Impossible de vérifier. Réessayez ou marquez comme vérifié manuellement.',

    // SPF
    SPF_NOT_FOUND: 'Aucun enregistrement SPF trouvé. Ajoutez un enregistrement TXT avec v=spf1.',
    SPF_MISSING_GOOGLE: 'SPF trouvé mais ne contient pas Google Workspace (include:_spf.google.com).',
    SPF_SUCCESS: 'SPF configuré correctement pour Google Workspace.',

    // DKIM
    DKIM_NOT_FOUND: (selector: string) =>
        `Sélecteur DKIM "${selector}" introuvable. Vérifiez la configuration dans Google Admin.`,
    DKIM_SUCCESS: 'DKIM configuré correctement.',

    // DMARC
    DMARC_NOT_FOUND: 'Aucun enregistrement DMARC trouvé. Ajoutez un enregistrement TXT pour _dmarc.',
    DMARC_SUCCESS: 'DMARC configuré correctement.',

    // Generic NOT_FOUND
    NOT_FOUND: (recordType: string) => `Enregistrement ${recordType} introuvable.`,

    // Manual override
    MANUAL_OVERRIDE_WARNING:
        'Sans vérification automatique, vos emails pourraient atterrir en spam. Êtes-vous sûr ?',
    MANUAL_OVERRIDE_SUCCESS: 'Marqué comme vérifié manuellement.',

    // Success
    ALL_PASS: '🎉 Votre domaine est prêt ! Tous les enregistrements DNS sont configurés.',
} as const;

// Record type labels in French
export const DNS_RECORD_LABELS = {
    spf: 'SPF',
    dkim: 'DKIM',
    dmarc: 'DMARC',
} as const;

export type DnsRecordType = keyof typeof DNS_RECORD_LABELS;
