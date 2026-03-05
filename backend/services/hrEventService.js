import EmailTemplate from '../models/EmailTemplate.js';
import User from '../models/User.js';
import brevoEmailService from './brevoEmailService.js';
import { logChange } from '../utils/changeLogService.js';

/**
 * HR Event Service
 * Maps HR events to email templates and dispatches emails via Brevo
 */
class HrEventService {
  // Mandatory event-to-template mapping
  static EVENT_TEMPLATE_MAP = {
    LEAVE_APPROVED: 'LEAVE_APPROVED',
    LEAVE_REJECTED: 'LEAVE_REJECTED',
    ATTENDANCE_OVERRIDDEN: 'ATTENDANCE_REMINDER',
    EMPLOYEE_ACTIVATED: 'EMPLOYEE_ACTIVATED',
    EMPLOYEE_DEACTIVATED: 'EMPLOYEE_DEACTIVATED',
    // New HR lifecycle events
    INTERVIEW_SCHEDULED_ONLINE: 'INTERVIEW_ONLINE',
    INTERVIEW_SCHEDULED_OFFLINE: 'INTERVIEW_OFFLINE',
    INTERVIEW_RESCHEDULED: 'INTERVIEW_RESCHEDULED',
    INTERVIEW_NO_SHOW: 'INTERVIEW_NO_SHOW',
    HIRING_APPLIED: 'HIRING_APPLIED',
    HIRED: 'HIRED',
    NOT_HIRED: 'NOT_HIRED',
    INACTIVITY_WARNING: 'INACTIVITY_WARNING',
    SERVER_JOIN_REMINDER: 'SERVER_JOIN_REMINDER',
    TEAM_CHOICE_INTERVIEWED: 'TEAM_CHOICE_INTERVIEWED',
    TEAM_CHOICE_NOT_INTERVIEWED: 'TEAM_CHOICE_NOT_INTERVIEWED',
    RESIGNATION_ACK: 'RESIGNATION_ACK',
    TERMINATION_NOTICE: 'TERMINATION_NOTICE',
    REJOIN_INVITE: 'REJOIN_INVITE',
    CONTACT_ACK: 'CONTACT_ACK'
  };

  /**
    * Handle HR event by sending appropriate email
    * @param {string} event - HR event type
    * @param {Object} data - Event data (supports both user and external recipients)
    * @param {string} workspaceId - Workspace ID
    */
   static async handleEvent(event, data, workspaceId) {
     try {
       console.log(`🔄 Processing HR event: ${event}`, data);

       // Determine recipient type and validate
       let recipientEmail = data.employeeEmail || data.recipientEmail || data.email;
       let recipientName = data.employeeName || data.recipientName || data.name;

       if (!recipientEmail) {
         console.log(`🚫 Skipping email for ${event}: No recipient email provided`);
         return {
           success: false,
           reason: 'No recipient email',
           event
         };
       }

       // For user-based events, check if employee is ACTIVE (skip for external recipients)
       if (data.employeeId && data.source !== 'EXTERNAL') {
         const employee = await User.findById(data.employeeId);
         if (!employee || employee.employmentStatus !== 'ACTIVE') {
           console.log(`🚫 Skipping email for ${event}: Employee not ACTIVE (status: ${employee?.employmentStatus})`);
           return {
             success: false,
             reason: 'Employee not active',
             event,
             employeeStatus: employee?.employmentStatus
           };
         }
         // Use employee data if available
         recipientEmail = employee.email;
         recipientName = employee.fullName;
       }

      // Get template code from mapping
      const templateCode = this.EVENT_TEMPLATE_MAP[event];
      if (!templateCode) {
        console.log(`⚠️ No template mapping for event: ${event}`);
        return { success: false, reason: 'No template mapping', event };
      }

      // Find template
      const template = await EmailTemplate.findOne({
        code: templateCode,
        isActive: true,
        $or: [
          { workspaceId },
          { workspaceId: null, isPredefined: true }
        ]
      });

      if (!template) {
        console.log(`⚠️ Template not found: ${templateCode} for workspace ${workspaceId}`);
        return { success: false, reason: 'Template not found', event, templateCode };
      }

      // Resolve variables (now async)
      const params = await this.resolveVariables(event, data);

      // Send email with layout wrapper
      const emailResult = await brevoEmailService.send({
        to: recipientEmail,
        subject: template.subject,
        htmlContent: template.htmlContent,
        params,
        useLayout: true // Wrap template content in base layout
      });

      // Log delivery result
      await logChange({
        event_type: 'hr_email_sent',
        target_type: data.source === 'EXTERNAL' ? 'external_recipient' : 'user',
        target_id: data.employeeId || null,
        action: 'send',
        description: `HR email sent for ${event}`,
        metadata: {
          event,
          templateCode,
          emailResult,
          messageId: emailResult.messageId,
          recipientEmail,
          recipientName,
          source: data.source || 'USER'
        },
        workspaceId
      });

      console.log(`✅ HR email sent for ${event}:`, emailResult);

      return {
        success: emailResult.success,
        event,
        templateCode,
        messageId: emailResult.messageId,
        employeeEmail: data.employeeEmail
      };

    } catch (error) {
      console.error(`❌ Error handling HR event ${event}:`, error);

      // Log error
      await logChange({
        event_type: 'hr_email_error',
        target_type: 'user',
        target_id: data.employeeId,
        action: 'error',
        description: `HR email failed for ${event}: ${error.message}`,
        metadata: { event, error: error.message },
        workspaceId
      });

      return {
        success: false,
        event,
        error: error.message
      };
    }
  }

  /**
   * Resolve variables for template interpolation
   */
  static async resolveVariables(event, data) {
    // Base variables
    const baseVars = {
      employeeName: data.employeeName || '',
      fullName: data.employeeName || '',
      employeeEmail: data.employeeEmail || '',
      currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      workspaceName: process.env.WORKSPACE_NAME || 'TaskFlow',
      loginUrl: process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app',
      supportEmail: process.env.EMAIL_FROM || 'support@taskflow.com'
    };

    switch (event) {
      case 'LEAVE_APPROVED':
        try {
          // Fetch complete leave data
          const leave = await import('../models/LeaveRequest.js').then(m => m.default.findById(data.leaveId).populate('leaveTypeId').populate('userId'));
          const approver = await User.findById(data.approvedById);
          const balance = await import('../models/LeaveBalance.js').then(m => m.default.findOne({
            userId: data.employeeId,
            leaveTypeId: data.leaveTypeId,
            year: new Date().getFullYear()
          }));

          return {
            ...baseVars,
            leaveType: leave?.leaveTypeId?.name || 'Leave',
            startDate: data.startDate ? new Date(data.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            endDate: data.endDate ? new Date(data.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            days: data.days || 0,
            approvedBy: approver?.full_name || 'HR Team',
            remainingDays: balance?.available || 0,
            reason: data.reason || ''
          };
        } catch (error) {
          console.error('Error resolving LEAVE_APPROVED variables:', error);
          return { ...baseVars, leaveType: 'Leave', days: data.days || 0 };
        }

      case 'LEAVE_REJECTED':
        try {
          const leave = await import('../models/LeaveRequest.js').then(m => m.default.findById(data.leaveId).populate('leaveTypeId'));
          const rejector = await User.findById(data.approvedById);

          return {
            ...baseVars,
            leaveType: leave?.leaveTypeId?.name || 'Leave',
            startDate: data.startDate ? new Date(data.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            endDate: data.endDate ? new Date(data.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            days: data.days || 0,
            rejectionReason: data.reason || 'Not specified',
            rejectedBy: rejector?.full_name || 'HR Team',
            reason: data.reason || ''
          };
        } catch (error) {
          console.error('Error resolving LEAVE_REJECTED variables:', error);
          return { ...baseVars, rejectionReason: data.reason || '' };
        }

      case 'ATTENDANCE_OVERRIDDEN':
        return {
          ...baseVars,
          attendanceId: data.attendanceId || '',
          overrideDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        };

      case 'EMPLOYEE_ACTIVATED':
        return {
          ...baseVars,
          activationDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        };

      case 'EMPLOYEE_DEACTIVATED':
        return {
          ...baseVars,
          deactivationDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        };

      default:
        return baseVars;
    }
  }
}

export default HrEventService;