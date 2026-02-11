import { LightningElement, api } from 'lwc';

export default class EmployeeSummary extends LightningElement {
    @api recordId;
    @api employee; // { name, branch, role }
    @api showDone = false;

    get recordUrl() {
        return this.recordId ? `/lightning/r/Employee__c/${this.recordId}/view` : null;
    }

    handleDoneClick() {
        this.dispatchEvent(new CustomEvent('done'));
    }
}
