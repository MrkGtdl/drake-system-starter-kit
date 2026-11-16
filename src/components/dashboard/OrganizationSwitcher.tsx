import { switchOrganization } from "@/app/(dashboard)/actions";

type OrganizationSwitcherProps = {
  organizations: {
    id: string;
    name: string;
  }[];
  activeOrganizationId: string | null;
};

export default function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
}: OrganizationSwitcherProps) {
  if (organizations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No organizations available
      </p>
    );
  }

  return (
    <form action={switchOrganization} className="flex items-center gap-2">
      <select
        name="organizationId"
        defaultValue={activeOrganizationId ?? ""}
        required
        className="h-9 max-w-56 rounded-md border bg-background px-3 text-sm"
        aria-label="Select organization"
      >
        {!activeOrganizationId && (
          <option value="" disabled>
            Select organization
          </option>
        )}

        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        Switch
      </button>
    </form>
  );
}
