"use client";

import { StaffAccountManager } from "@/components/common/staff-account-manager";
import { createStaffAccount, fetchStaffAccounts } from "@/lib/api";

export function AdminStaffTab() {
  return (
    <StaffAccountManager
      title="Gestion du personnel"
      description="Créez les comptes vendeur·se — chaque vendeur gère ensuite son propre catalogue en CRUD complet et peut créer ses propres comptes caissier·e depuis son tableau de bord."
      roleLabel="Vendeur·se"
      emptyLabel="Aucun compte vendeur·se pour le moment."
      loadErrorLabel="Impossible de charger la liste des vendeurs pour le moment."
      successMessage={(email) => `Compte vendeur·se créé pour ${email}.`}
      fetchAccounts={fetchStaffAccounts}
      createAccount={createStaffAccount}
    />
  );
}
