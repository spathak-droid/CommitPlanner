import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import { useStore } from '../store/useStore';

type EntityType = 'rally-cry' | 'objective' | 'outcome';

type FormDialogState =
  | {
      mode: 'create';
      type: 'objective' | 'outcome';
      parentId: string;
      title: string;
      submitLabel: string;
      values: { name: string; description: string; measurableTarget: string };
    }
  | {
      mode: 'edit';
      type: EntityType;
      id: string;
      title: string;
      submitLabel: string;
      values: { name: string; description: string; measurableTarget: string };
    };

type ArchiveDialogState = {
  type: EntityType;
  id: string;
  name: string;
};

const typeLabel: Record<EntityType, string> = {
  'rally-cry': 'Rally Cry',
  objective: 'Defining Objective',
  outcome: 'Outcome',
};

const RcdoHierarchyPage: React.FC = () => {
  const { rcdoTree, fetchRcdo, loadingRcdo, role, showToast } = useStore();
  const [creatingRallyCry, setCreatingRallyCry] = useState({ name: '', description: '' });
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null);
  const [archiveDialog, setArchiveDialog] = useState<ArchiveDialogState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isManager = role === 'MANAGER';

  useEffect(() => {
    void fetchRcdo();
  }, [fetchRcdo]);

  const reload = async () => {
    try {
      await fetchRcdo();
    } catch {
      // store toast handles fetch failure
    }
  };

  const dialogHasTarget = formDialog?.type === 'outcome';

  const openEditDialog = (
    type: EntityType,
    id: string,
    current: { name: string; description: string; measurableTarget?: string }
  ) => {
    setFormDialog({
      mode: 'edit',
      type,
      id,
      title: `Edit ${typeLabel[type]}`,
      submitLabel: `Save ${typeLabel[type]}`,
      values: {
        name: current.name,
        description: current.description,
        measurableTarget: current.measurableTarget ?? '',
      },
    });
  };

  const openCreateDialog = (type: 'objective' | 'outcome', parentId: string) => {
    setFormDialog({
      mode: 'create',
      type,
      parentId,
      title: type === 'objective' ? 'Add Defining Objective' : 'Add Outcome',
      submitLabel: type === 'objective' ? 'Create Objective' : 'Create Outcome',
      values: {
        name: '',
        description: '',
        measurableTarget: '',
      },
    });
  };

  const handleCreateRallyCry = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.createRallyCry(creatingRallyCry);
      setCreatingRallyCry({ name: '', description: '' });
      showToast('Rally Cry created', 'success');
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create Rally Cry', 'error');
    }
  };

  const handleSubmitDialog = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formDialog) return;

    const values = {
      name: formDialog.values.name.trim(),
      description: formDialog.values.description.trim(),
      measurableTarget: formDialog.values.measurableTarget.trim(),
    };

    if (!values.name) {
      showToast('Name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (formDialog.mode === 'edit') {
        if (formDialog.type === 'rally-cry') {
          await api.updateRallyCry(formDialog.id, { name: values.name, description: values.description });
        }
        if (formDialog.type === 'objective') {
          await api.updateDefiningObjective(formDialog.id, { name: values.name, description: values.description });
        }
        if (formDialog.type === 'outcome') {
          await api.updateOutcome(formDialog.id, {
            name: values.name,
            description: values.description,
            measurableTarget: values.measurableTarget,
          });
        }
        showToast(`${typeLabel[formDialog.type]} updated`, 'success');
      } else {
        if (formDialog.type === 'objective') {
          await api.createDefiningObjective(formDialog.parentId, {
            name: values.name,
            description: values.description,
          });
          showToast('Objective created', 'success');
        }
        if (formDialog.type === 'outcome') {
          await api.createOutcome(formDialog.parentId, {
            name: values.name,
            description: values.description,
            measurableTarget: values.measurableTarget,
          });
          showToast('Outcome created', 'success');
        }
      }
      setFormDialog(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save hierarchy item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveDialog) return;
    setSubmitting(true);
    try {
      if (archiveDialog.type === 'rally-cry') await api.deleteRallyCry(archiveDialog.id);
      if (archiveDialog.type === 'objective') await api.deleteDefiningObjective(archiveDialog.id);
      if (archiveDialog.type === 'outcome') await api.deleteOutcome(archiveDialog.id);
      showToast(`${typeLabel[archiveDialog.type]} archived`, 'success');
      setArchiveDialog(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : `Failed to archive ${typeLabel[archiveDialog.type]}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRcdo) {
    return <div className="flex items-center justify-center h-96 text-secondary">Loading...</div>;
  }

  return (
    <>
      <div className="space-y-10">
        <div className="space-y-3">
          <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Strategy</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface">RCDO Hierarchy</h1>
          <p className="text-secondary text-lg font-medium">Organizational strategy flow — Rally Cries, Defining Objectives, Outcomes</p>
        </div>

        {isManager && (
          <form onSubmit={handleCreateRallyCry} className="bg-surface-lowest rounded-[1.5rem] p-6 shadow-[0px_20px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Strategy Admin</p>
              <p className="mt-2 text-sm text-secondary">Managers can evolve the hierarchy without leaving the weekly planning module.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr_auto]">
              <input
                value={creatingRallyCry.name}
                onChange={(e) => setCreatingRallyCry((current) => ({ ...current, name: e.target.value }))}
                className="bg-surface-container-low rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="New Rally Cry"
                required
              />
              <input
                value={creatingRallyCry.description}
                onChange={(e) => setCreatingRallyCry((current) => ({ ...current, description: e.target.value }))}
                className="bg-surface-container-low rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Description"
                required
              />
              <button type="submit" className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg shadow-primary/20">
                Add Rally Cry
              </button>
            </div>
          </form>
        )}

        {rcdoTree.map((rc) => (
          <div key={rc.id} className="space-y-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-container/60 to-tertiary-container/20 rounded-[1rem] p-8 border border-white/40">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="inline-block px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-[10px] font-black tracking-widest mb-3">RALLY CRY</span>
                  <h3 className="text-2xl font-extrabold text-on-surface mb-2">{rc.name}</h3>
                  <p className="text-secondary font-medium leading-relaxed">{rc.description}</p>
                </div>
                {isManager && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditDialog('rally-cry', rc.id, { name: rc.name, description: rc.description })}
                      className="px-4 py-2 rounded-full bg-white text-xs font-bold text-secondary ring-1 ring-outline-variant/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openCreateDialog('objective', rc.id)}
                      className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold"
                    >
                      Add Objective
                    </button>
                    <button
                      onClick={() => setArchiveDialog({ type: 'rally-cry', id: rc.id, name: rc.name })}
                      className="px-4 py-2 rounded-full bg-error-container text-on-error-container text-xs font-bold"
                    >
                      Archive
                    </button>
                  </div>
                )}
              </div>
            </div>

            {rc.definingObjectives.map((dobj) => (
              <div key={dobj.id} className="ml-6 space-y-2">
                <div className="bg-surface-lowest rounded-[1rem] p-6 shadow-sm ring-1 ring-outline-variant/10 border-l-4 border-l-tertiary">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-tertiary block mb-1">DEFINING OBJECTIVE</span>
                      <h4 className="font-bold text-on-surface mb-1">{dobj.name}</h4>
                      <p className="text-sm text-secondary">{dobj.description}</p>
                    </div>
                    {isManager && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEditDialog('objective', dobj.id, { name: dobj.name, description: dobj.description })}
                          className="px-4 py-2 rounded-full bg-white text-xs font-bold text-secondary ring-1 ring-outline-variant/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openCreateDialog('outcome', dobj.id)}
                          className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold"
                        >
                          Add Outcome
                        </button>
                        <button
                          onClick={() => setArchiveDialog({ type: 'objective', id: dobj.id, name: dobj.name })}
                          className="px-4 py-2 rounded-full bg-error-container text-on-error-container text-xs font-bold"
                        >
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {dobj.outcomes.map((outcome) => (
                  <div key={outcome.id} className="ml-6 bg-surface-lowest rounded-[1rem] p-5 shadow-sm ring-1 ring-outline-variant/10 border-l-4 border-l-primary">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-primary block mb-1">KEY OUTCOME</span>
                        <h5 className="font-bold text-sm text-on-surface mb-1">{outcome.name}</h5>
                        <p className="text-sm text-secondary mb-2">{outcome.description}</p>
                        {outcome.measurableTarget && (
                          <span className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container text-xs font-bold px-3 py-1 rounded-full">
                            <span className="material-symbols-outlined text-sm">track_changes</span>
                            {outcome.measurableTarget}
                          </span>
                        )}
                      </div>
                      {isManager && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditDialog('outcome', outcome.id, {
                              name: outcome.name,
                              description: outcome.description,
                              measurableTarget: outcome.measurableTarget,
                            })}
                            className="px-4 py-2 rounded-full bg-white text-xs font-bold text-secondary ring-1 ring-outline-variant/10"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setArchiveDialog({ type: 'outcome', id: outcome.id, name: outcome.name })}
                            className="px-4 py-2 rounded-full bg-error-container text-on-error-container text-xs font-bold"
                          >
                            Archive
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {formDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[1.75rem] bg-white p-7 shadow-[0px_28px_80px_rgba(27,27,30,0.2)] ring-1 ring-outline-variant/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">RCDO Editor</p>
                <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-on-surface">{formDialog.title}</h2>
                <p className="mt-2 text-sm text-secondary">
                  Update the strategic hierarchy in place without leaving the module.
                </p>
              </div>
              <button
                onClick={() => setFormDialog(null)}
                className="rounded-full bg-surface-container-low p-2 text-secondary transition-colors hover:text-on-surface"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitDialog} className="mt-6 space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-secondary">Name</label>
                  <input
                    value={formDialog.values.name}
                    onChange={(e) => setFormDialog((current) => current ? {
                      ...current,
                      values: { ...current.values, name: e.target.value },
                    } : current)}
                    className="w-full rounded-[1rem] bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-secondary">Description</label>
                  <textarea
                    value={formDialog.values.description}
                    onChange={(e) => setFormDialog((current) => current ? {
                      ...current,
                      values: { ...current.values, description: e.target.value },
                    } : current)}
                    className="min-h-[110px] w-full rounded-[1rem] bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Describe the intent and expected impact"
                  />
                </div>

                {dialogHasTarget && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-secondary">Measurable Target</label>
                    <input
                      value={formDialog.values.measurableTarget}
                      onChange={(e) => setFormDialog((current) => current ? {
                        ...current,
                        values: { ...current.values, measurableTarget: e.target.value },
                      } : current)}
                      className="w-full rounded-[1rem] bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Example: Increase completion rate to 85%"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormDialog(null)}
                  className="px-5 py-3 rounded-full bg-surface-container-low text-on-surface text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {formDialog.submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-7 shadow-[0px_28px_80px_rgba(27,27,30,0.2)] ring-1 ring-outline-variant/10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-error">Archive Item</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-on-surface">Archive {typeLabel[archiveDialog.type]}?</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              <span className="font-bold text-on-surface">{archiveDialog.name}</span> will be marked inactive and removed from future contributor planning choices.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setArchiveDialog(null)}
                className="px-5 py-3 rounded-full bg-surface-container-low text-on-surface text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleArchive()}
                disabled={submitting}
                className="px-6 py-3 rounded-full bg-error text-on-error text-sm font-bold disabled:opacity-50"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RcdoHierarchyPage;
