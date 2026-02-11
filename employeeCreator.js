import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';
import EMPLOYEE_CREATED_CHANNEL from '@salesforce/messageChannel/EmployeeCreated__c';

export default class EmployeeCreator extends LightningElement {
    @wire(MessageContext) messageContext;

    // store Employee_ID__c from submit so we can publish it after success
    createdEmployeeId;

    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;

        this.createdEmployeeId = fields.Employee_ID__c;

        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleSuccess(event) {
        const recordId = event.detail.id;

        publish(this.messageContext, EMPLOYEE_CREATED_CHANNEL, {
            employeeId: this.createdEmployeeId,
            recordId
        });

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Employee Created',
                message: `Employee ${this.createdEmployeeId} created successfully.`,
                variant: 'success'
            })
        );

        // clear form
        this.template.querySelectorAll('lightning-input-field').forEach((f) => f.reset());
        this.createdEmployeeId = null;
    }
}
