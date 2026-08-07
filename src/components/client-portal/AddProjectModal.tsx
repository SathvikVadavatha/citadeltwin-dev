import React, { useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadForm } from '@/components/upload/UploadForm';
import { AddressAutocompleteInput, ResolvedAddress } from './AddressAutocompleteInput';
import { BUILDING_TYPES } from './buildingTypeOptions';
import { useToast } from '@/components/ui/use-toast';
import { ClientPortalProject, NewClientPortalProject } from '@/hooks/useClientPortalProjects';

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `file` is the freshly-picked blueprint, if the user selected a new one this submission. */
  onSubmit: (input: NewClientPortalProject, file?: File) => Promise<void>;
  /** When set, the modal edits this project instead of creating a new one. */
  project?: ClientPortalProject | null;
}

interface ExistingBlueprint {
  name: string;
  size: number | null;
  type: string | null;
}

interface AddProjectFormState {
  projectName: string;
  clientName: string;
  address: ResolvedAddress | null;
  buildingType: string;
  buildingSubType: string;
  blueprintFile: File | null;
  existingBlueprint: ExistingBlueprint | null;
}

const initialFormState: AddProjectFormState = {
  projectName: '',
  clientName: '',
  address: null,
  buildingType: '',
  buildingSubType: '',
  blueprintFile: null,
  existingBlueprint: null,
};

const buildFormState = (project?: ClientPortalProject | null): AddProjectFormState => {
  if (!project) return initialFormState;

  return {
    projectName: project.project_name,
    clientName: project.client_name,
    address:
      project.site_address && project.latitude != null && project.longitude != null
        ? { formattedAddress: project.site_address, lat: project.latitude, lng: project.longitude }
        : null,
    buildingType: project.building_type ?? '',
    buildingSubType: project.building_sub_type ?? '',
    blueprintFile: null,
    existingBlueprint: project.blueprint_file_name
      ? { name: project.blueprint_file_name, size: project.blueprint_file_size, type: project.blueprint_file_type }
      : null,
  };
};

const FieldError: React.FC<{ show: boolean; message: string }> = ({ show, message }) =>
  show ? <p className="text-xs text-destructive mt-1">{message}</p> : null;

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ open, onOpenChange, onSubmit, project }) => {
  const { toast } = useToast();
  const isEditMode = !!project;
  const [form, setForm] = useState<AddProjectFormState>(initialFormState);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Synchronous guard against re-entrant submits — state updates alone can lag a frame
  // behind a fast double-click, this can't.
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setForm(buildFormState(project));
      setTouched(false);
      setSubmitError(null);
    }
    // Only re-seed when the dialog transitions open — editing shouldn't reset mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedType = BUILDING_TYPES.find((t) => t.value === form.buildingType);

  const errors = {
    projectName: form.projectName.trim() ? null : 'Project name is required.',
    clientName: form.clientName.trim() ? null : 'Client name is required.',
    address: form.address ? null : 'Select an address from the suggestions list — typed text alone isn\'t enough.',
    buildingType: form.buildingType ? null : 'Select a building type.',
    buildingSubType: selectedType && !form.buildingSubType ? 'Select a sub-type.' : null,
    blueprintFile: form.blueprintFile || form.existingBlueprint ? null : 'Upload a blueprint file to continue.',
  };

  const isValid = Object.values(errors).every((e) => e === null);

  const resetAndClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(initialFormState);
      setTouched(false);
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleBuildingTypeChange = (value: string) => {
    setTouched(true);
    setForm((prev) => ({ ...prev, buildingType: value, buildingSubType: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setSubmitError(null);
    setSubmitting(true);

    const projectName = form.projectName.trim();

    try {
      await onSubmit(
        {
          projectName,
          clientName: form.clientName.trim(),
          siteAddress: form.address?.formattedAddress ?? null,
          latitude: form.address?.lat ?? null,
          longitude: form.address?.lng ?? null,
          buildingType: form.buildingType,
          buildingSubType: form.buildingSubType,
          blueprintFileName: form.blueprintFile?.name ?? form.existingBlueprint?.name ?? null,
          blueprintFileSize: form.blueprintFile?.size ?? form.existingBlueprint?.size ?? null,
          blueprintFileType: form.blueprintFile?.type ?? form.existingBlueprint?.type ?? null,
        },
        form.blueprintFile ?? undefined
      );

      toast({
        title: isEditMode ? 'Project updated' : 'Project added',
        description: isEditMode
          ? `"${projectName}" was updated.`
          : `"${projectName}" was saved to your projects.`,
      });

      resetAndClose(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save the project. Please try again.');
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={resetAndClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl max-h-[85vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
              {isEditMode ? 'Edit Project Details' : 'Add New Project'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {isEditMode
                ? 'Update the project basics below.'
                : 'Capture the project basics to kick off a new client engagement.'}
            </DialogPrimitive.Description>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={form.projectName}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectName: e.target.value }))}
                  onBlur={() => setTouched(true)}
                  placeholder="e.g. Maple Street Residence"
                />
                <FieldError show={touched} message={errors.projectName ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-name">Client Name</Label>
                <Input
                  id="client-name"
                  value={form.clientName}
                  onChange={(e) => setForm((prev) => ({ ...prev, clientName: e.target.value }))}
                  onBlur={() => setTouched(true)}
                  placeholder="e.g. Jordan Blake"
                />
                <FieldError show={touched} message={errors.clientName ?? ''} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-address">Site Address</Label>
              <AddressAutocompleteInput
                id="site-address"
                defaultValue={project?.site_address ?? undefined}
                onResolvedChange={(address) => {
                  setTouched(true);
                  setForm((prev) => ({ ...prev, address }));
                }}
              />
              <FieldError show={touched} message={errors.address ?? ''} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building-type">Building Type</Label>
                <Select value={form.buildingType} onValueChange={handleBuildingTypeChange}>
                  <SelectTrigger id="building-type">
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError show={touched} message={errors.buildingType ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="building-sub-type">Sub-Type</Label>
                <Select
                  value={form.buildingSubType}
                  onValueChange={(value) => {
                    setTouched(true);
                    setForm((prev) => ({ ...prev, buildingSubType: value }));
                  }}
                  disabled={!selectedType}
                >
                  <SelectTrigger id="building-sub-type">
                    <SelectValue placeholder={selectedType ? 'Select sub-type' : 'Select a type first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedType?.subTypes.map((subType) => (
                      <SelectItem key={subType.value} value={subType.value}>
                        {subType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError show={touched} message={errors.buildingSubType ?? ''} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Blueprint File</Label>
              {form.blueprintFile || form.existingBlueprint ? (
                <div className="flex items-center justify-between gap-3 p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {form.blueprintFile?.name ?? form.existingBlueprint?.name}
                      </p>
                      {(() => {
                        const size = form.blueprintFile?.size ?? form.existingBlueprint?.size;
                        return size != null ? (
                          <p className="text-xs text-muted-foreground">{(size / 1024).toFixed(1)} KB</p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, blueprintFile: null, existingBlueprint: null }))}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <UploadForm
                  uploading={false}
                  processing={false}
                  uploadProgress={0}
                  onFileUpload={(file) => {
                    setTouched(true);
                    setForm((prev) => ({ ...prev, blueprintFile: file }));
                  }}
                />
              )}
              <FieldError show={touched} message={errors.blueprintFile ?? ''} />
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => resetAndClose(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Add Project'}
              </Button>
            </div>
          </form>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
