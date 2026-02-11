import { LightningElement, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import EMPLOYEE_CREATED_CHANNEL from '@salesforce/messageChannel/EmployeeCreated__c';

export default class OnboardingWizard extends LightningElement {
    employeeIdDraft = '';
    employeeId = '';

    employeeRecordId = null;
    employee = null; // { name, branch, role }

    message = '';
    messageVariant = 'info'; // 'info' | 'error'

    // ---------- LMS ----------
    @wire(MessageContext) messageContext;
    subscription = null;

    connectedCallback() {
        if (this.subscription) return;

        this.subscription = subscribe(
            this.messageContext,
            EMPLOYEE_CREATED_CHANNEL,
            (payload) => this.handleEmployeeCreatedMessage(payload),
            { scope: APPLICATION_SCOPE }
        );
    }

    disconnectedCallback() {
        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
    }

    handleEmployeeCreatedMessage(payload) {
        const newEmployeeId = (payload?.employeeId || '').trim();
        if (!newEmployeeId) return;

        this.employeeIdDraft = newEmployeeId;
        this.handleSearch();
    }

    // ---------- Getters ----------
    get hasEmployee() {
        return !!this.employee && !!this.employeeRecordId;
    }

    get isSearchDisabled() {
        return !(this.employeeIdDraft || '').trim();
    }

    get messageClass() {
        const base = 'slds-m-top_small slds-text-body_small ';
        return this.messageVariant === 'error'
            ? base + 'slds-text-color_error'
            : base;
    }

    // ---------- Handlers ----------
    handleEmployeeIdDraftChange(event) {
        this.employeeIdDraft = event.target.value;
        this.message = '';
        this.messageVariant = 'info';
    }

    handleSearch() {
        const value = (this.employeeIdDraft || '').trim();

        // reset previous result
        this.employee = null;
        this.employeeRecordId = null;
        this.message = '';
        this.messageVariant = 'info';

        if (!value) {
            this.messageVariant = 'error';
            this.message = 'Please enter an Employee ID.';
            this.employeeId = '';
            return;
        }

        // triggers <c-employee-lookup>
        this.employeeId = value;
    }

    handleLookupResult(event) {
        const { status, recordId, employee, message } = event.detail || {};

        if (status === 'FOUND') {
            this.employeeRecordId = recordId;
            this.employee = employee;
            this.message = '';
            this.messageVariant = 'info';
            return;
        }

        // NOT_FOUND or ERROR
        this.employeeRecordId = null;
        this.employee = null;
        this.messageVariant = 'error';
        this.message = message || 'Employee lookup failed.';
    }

    // Reset button (in search box)
    handleReset() {
        this.employeeIdDraft = '';
        this.employeeId = '';
        this.employeeRecordId = null;
        this.employee = null;
        this.message = '';
        this.messageVariant = 'info';
    }

    // Done button (in summary card)
    handleDone() {
        // For now: Done behaves like clearing the screen for the next search
        this.handleReset();
    }
}
