import { LightningElement } from 'lwc';

export default class SimpleOnboardingCopy extends LightningElement {
  recordId = null;
  message = '';

  get recordLink() {
    return this.recordId
      ? `/lightning/r/Bank_Onboarding__c/${this.recordId}/view`
      : '';
  }

  save() {
    this.message = '';
    const form = this.template.querySelector('[data-id="step1form"]');
    form.submit();
  }

  handleSuccess(event) {
    this.recordId = event.detail.id;
    this.message = 'Step 1 (copy) saved successfully!';
  }

  handleError() {
    this.message = 'Save failed. Please check required fields or permissions.';
  }
}
