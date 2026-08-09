import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import sendEmail from '../utils/nodemailer.js';
import { getCustomer360Profile, searchCrmCustomers } from '../services/CrmService.js';

export const getMyCrmProfile = async (req, res, next) => {
  try {
    const profile = await getCustomer360Profile(req.user.id);
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getAdminCustomer360 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await getCustomer360Profile(id);
    if (!profile) return res.status(404).json({ success: false, message: 'Customer not found' });
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getAdminCustomerList = async (req, res, next) => {
  try {
    const { search, segment, tier, page = 1, limit = 10 } = req.query;
    const result = await searchCrmCustomers({ search, segment, tier, page, limit });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const { name, targetSegment, subject, message, couponCode } = req.body;
    if (!name || !targetSegment || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All campaign fields are required' });
    }

    const campaign = await Campaign.create({
      name,
      targetSegment,
      subject,
      message,
      couponCode: couponCode || '',
      status: 'Draft',
    });

    return res.status(201).json({ success: true, message: 'Campaign created in draft', data: campaign });
  } catch (error) {
    next(error);
  }
};

export const sendCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    // Fetch customers belonging to target segment
    const { customers } = await searchCrmCustomers({ segment: campaign.targetSegment, limit: 100 });

    let count = 0;
    for (const c of customers) {
      try {
        await sendEmail({
          email: c.email,
          subject: campaign.subject,
          message: campaign.message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #ff5e36;">Special Offer for You, ${c.name}!</h2>
              <p>${campaign.message}</p>
              ${
                campaign.couponCode
                  ? `<div style="padding: 15px; background-color: #fff2ee; border: 2px dashed #ff5e36; text-align: center; margin: 20px 0; font-size: 20px; font-weight: bold; color: #ff5e36;">
                      Use Code: ${campaign.couponCode}
                     </div>`
                  : ''
              }
              <p>Order now at PizzaHub to enjoy fresh artisan pizza!</p>
            </div>
          `,
        });
        count++;
      } catch (err) {
        console.error(`Failed sending campaign email to ${c.email}:`, err);
      }
    }

    campaign.status = 'Sent';
    campaign.sentCount = count;
    campaign.sentAt = new Date();
    await campaign.save();

    return res.status(200).json({ success: true, message: `Campaign sent to ${count} customers`, data: campaign });
  } catch (error) {
    next(error);
  }
};
