// Fix crosshair working with zoom & rotation
export const FF_DEV_1285 = "ff_front_dev_1285_crosshair_wrong_zoom_140122_short";

// Outliner + Details
export const FF_DEV_1170 = "ff_front_1170_outliner_030222_short";

// Fix stuck userpic
export const FF_DEV_1507 = "ff_front_DEV_1507_stuck_userpic_210122_short";

// Auto-annotation regions are not visible until refresh
export const FF_DEV_1555 = "ff_front_dev_1555_auto_annotations_not_visible";

// Fix shortcuts focus and cursor problems
export const FF_DEV_1564_DEV_1565 = "ff_front_dev_1564_dev_1565_shortcuts_focus_and_cursor_010222_short";

// Fix work of shortcuts in results
// @requires FF_DEV_1564_DEV_1565
export const FF_DEV_1566 = "ff_front_dev_1566_shortcuts_in_results_010222_short";

// User labels for Taxonomy
export const FF_DEV_1536 = "ff_front_dev_1536_taxonomy_user_labels_150222_long";

// Show or not dialog for rejection
export const FF_DEV_1593 = "ff_front_1593_rejection_comment_040222_short";

// New Audio 2.0 UI
export const FF_DEV_1713 = "ff_front_DEV_1713_audio_ui_150222_short";

// Add visibleWhen="choice-unselected" option
export const FF_DEV_1372 = "ff_front_dev_1372_visible_when_choice_unselected_11022022_short";

// Add an interactivity flag to the results to make some predictions' results be able to be automatically added to newly created annotations.
export const FF_DEV_1621 = "ff_front_dev_1621_interactive_mode_150222_short";

// Fix lag on first video playing start
export const FF_DEV_1265 = "ff_front_dev_1265_video_start_lag_100322_short";

// Keep enabled state of video region on area transformations
export const FF_DEV_1494 = "ff_front_dev_1494_keep_enabled_on_update_090322_short";

// Fix video timeline expanding and collapsing in full screen mode
export const FF_DEV_1270 = "ff_front_dev_1270_fullscreen_timeline_expand_090322_short";

// Add ability to generate children tags from task data
export const FF_DEV_2007_DEV_2008 = "ff_dev_2007_dev_2008_dynamic_tag_children_250322_short";

// Rework of Choices tag
export const FF_DEV_2007 = "ff_dev_2007_rework_choices_280322_short";

// Clean unnecessary classification areas after deserialization
export const FF_DEV_2100 = "ff_dev_2100_clean_unnecessary_areas_140422_short";

// Allow to use html inside <Label/> tags
export const FF_DEV_2128 = "ff_dev_2128_html_in_labels_150422_short";

function getFeatureFlags() {
  return window.APP_SETTINGS?.feature_flags || {
    // ff_front_DEV_1713_audio_ui_150222_short: true,
  };
}

export function isFF(id: string) {
  const featureFlags = getFeatureFlags();

  if (id in featureFlags) {
    return featureFlags[id] === true;
  } else {
    return window.APP_SETTINGS?.feature_flags_default_value === true;
  }
}
