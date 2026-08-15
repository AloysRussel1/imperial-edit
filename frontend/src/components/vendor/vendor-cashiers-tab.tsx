"use client";

import { StaffAccountManager } from "@/components/common/staff-account-manager";
import { createCashierAccount, fetchCashierAccounts } from "@/lib/api";

export function VendorCashiersTab() {
  return (
    <StaffAccountManager
      title="Mon Personnel / Caissiers"
      description="Créez les comptes caissier·e de votre boutique — accès en lecture seule au catalogue et à la Caisse (POS) uniquement, jamais de droit d'édition."
      roleLabel="Caissier·e"
      emptyLabel="Aucun compte caissier·e pour le moment."
      loadErrorLabel="Impossible de charger la liste des caissiers pour le moment."
      successMessage={(email) => `Compte caissier·e créé pour ${email}.`}
      fetchAccounts={fetchCashierAccounts}
      createAccount={createCashierAccount}
    />
  );
}
