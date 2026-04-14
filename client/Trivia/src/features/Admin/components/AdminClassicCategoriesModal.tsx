import React from 'react';
import AdminStyle from '@/Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '@/Styles/ComponentStyles/AdminDashboardStyle';
import { AdminModal } from './AdminUi';
import { STRINGS } from '@/constants/strings';

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export default function AdminClassicCategoriesModal({
  open,
  busy,
  classicCategoryForm,
  setClassicCategoryForm,
  classicCategories,
  classicCategorySeedCounts,
  setClassicCategorySeedCounts,
  onClose,
  onCreateClassicCategory,
  onLoadClassicCategories,
  onOpenPool,
  onOpenPicker,
  onOpenClassicLevels,
  onDeleteClassicCategory,
  onSeedClassicCategoryPool,
}) {
  return (
    <AdminModal
      open={open}
      title={STRINGS.ADMIN.modals.classicCategoriesTitle}
      onClose={onClose}
      maxWidth={980}
    >
      <div style={AdminStyle.sectionSub}>
        {STRINGS.ADMIN.sections.classicCategoriesSubtitle}
      </div>

      <div style={AdminDashboardStyle.rowMt12}>
        <input
          style={AdminDashboardStyle.inputFlex1}
          value={classicCategoryForm.name}
          onChange={(e) => setClassicCategoryForm((v) => ({ ...v, name: e.target.value }))}
          placeholder={STRINGS.ADMIN.text.classicCategoryNamePlaceholder}
          disabled={busy}
        />
        <input
          style={AdminDashboardStyle.inputW160}
          value={classicCategoryForm.icon}
          onChange={(e) => setClassicCategoryForm((v) => ({ ...v, icon: e.target.value }))}
          placeholder={STRINGS.ADMIN.text.classicCategoryIconPlaceholder}
          disabled={busy}
        />
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btnPrimaryFull}
          onClick={onCreateClassicCategory}
          disabled={busy || !String(classicCategoryForm.name || '').trim()}
        >
          {STRINGS.ADMIN.actions.create}
        </button>
      </div>

      <div style={AdminDashboardStyle.rowMt12}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={onLoadClassicCategories}
          disabled={busy}
        >
          {STRINGS.ADMIN.actions.refreshList}
        </button>
        <span style={AdminStyle.pill}>
          {STRINGS.ADMIN.pills.categories} {classicCategories.length}
        </span>
      </div>

      <div style={AdminDashboardStyle.listMt12}>
        {classicCategories.map((category) => (
          <div key={category.id} style={AdminStyle.listItem}>
            <div style={AdminDashboardStyle.modeHeader}>
              <div style={AdminDashboardStyle.levelLeft}>
                <div style={AdminStyle.listItemTitle}>
                  {category.icon ? `${category.icon} ` : ''}
                  {category.name}
                </div>
                <div style={AdminStyle.listItemMeta}>
                  <span style={AdminStyle.pill}>
                    {STRINGS.ADMIN.pills.pool}{' '}
                    {category.pool_count == null
                      ? STRINGS.COMMON.separators.emDash
                      : category.pool_count}
                  </span>
                  <span style={AdminStyle.pill}>{category.id}</span>
                </div>
              </div>

              <div style={AdminDashboardStyle.actionCol}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  onClick={() =>
                    onOpenPool({
                      kind: 'classic_category',
                      id: category.id,
                      title: STRINGS.ADMIN.format.classicCategoryPoolTitle(category.name),
                      offset: 0,
                    })
                  }
                  disabled={busy}
                >
                  {STRINGS.ADMIN.actions.viewPool}
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btnPrimaryFull}
                  onClick={() =>
                    onOpenPicker({
                      kind: 'classic_category',
                      id: category.id,
                      title: STRINGS.ADMIN.format.classicCategoryPoolTitle(category.name),
                    })
                  }
                  disabled={busy}
                >
                  {STRINGS.ADMIN.actions.addQuestions}
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  onClick={() => onOpenClassicLevels(category)}
                  disabled={busy}
                  title="Manage classic levels for this category"
                >
                  Levels
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminDashboardStyle.dangerBtn}
                  onClick={() => onDeleteClassicCategory(category.id, category.name)}
                  disabled={busy}
                  title={STRINGS.ADMIN.hints.deleteCategoryTitle}
                >
                  {STRINGS.ADMIN.actions.deleteCategory}
                </button>
              </div>
            </div>

            <div style={AdminDashboardStyle.rowMt10}>
              <input
                style={AdminDashboardStyle.inputW120}
                type="number"
                min={1}
                max={100}
                value={classicCategorySeedCounts[category.id] ?? 25}
                onChange={(e) =>
                  setClassicCategorySeedCounts((v) => ({
                    ...v,
                    [category.id]: clampInt(e.target.value, 1, 100),
                  }))
                }
                disabled={busy}
              />
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={() => onSeedClassicCategoryPool(category.id)}
                disabled={busy}
                title={STRINGS.ADMIN.hints.seedClassicCategoryTitle}
              >
                {STRINGS.ADMIN.actions.autoFill}
              </button>
            </div>
          </div>
        ))}

        {classicCategories.length === 0 && (
          <div style={AdminDashboardStyle.emptyText}>
            {STRINGS.ADMIN.sections.noCategoriesFound}
          </div>
        )}
      </div>
    </AdminModal>
  );
}


