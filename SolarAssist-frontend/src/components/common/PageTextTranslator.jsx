import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const translations = {
  hi: {
    'Dashboard': 'डैशबोर्ड', 'Solar Planner': 'सोलर प्लानर', 'My Recommendation': 'मेरी सिफारिश',
    'Financial Analysis': 'वित्तीय विश्लेषण', 'Verified Vendors': 'सत्यापित विक्रेता', 'Reports': 'रिपोर्ट',
    'My Products & Services': 'मेरे उत्पाद और सेवाएं', 'Add New Product / Service': 'नया उत्पाद / सेवा जोड़ें',
    'Available': 'उपलब्ध', 'Out of Stock': 'स्टॉक में नहीं', 'Edit': 'संपादित करें', 'Delete': 'हटाएं',
    'Incoming Customer Requests': 'आने वाले ग्राहक अनुरोध', 'Request Overview': 'अनुरोध विवरण',
    'Customer Info': 'ग्राहक जानकारी', 'System Requirement': 'सिस्टम आवश्यकता', 'Update Request Status': 'अनुरोध स्थिति अपडेट करें',
    'Accept Quote': 'कोटेशन स्वीकार करें', 'Complete Job': 'काम पूरा करें', 'Reject Request': 'अनुरोध अस्वीकार करें',
    'Accept': 'स्वीकार करें', 'Reject': 'अस्वीकार करें', 'PENDING': 'लंबित', 'ACCEPTED': 'स्वीकृत',
    'COMPLETED': 'पूरा हुआ', 'REJECTED': 'अस्वीकृत', 'Price:': 'कीमत:', 'Warranty:': 'वारंटी:',
    'Capacity:': 'क्षमता:', 'Location:': 'स्थान:', 'Service Package:': 'सेवा पैकेज:',
    'Customer Name': 'ग्राहक का नाम', 'Service': 'सेवा', 'Date': 'तारीख', 'Status': 'स्थिति',
    'My Solar Report': 'मेरी सोलर रिपोर्ट', 'Open Report': 'रिपोर्ट खोलें', 'Download Report': 'रिपोर्ट डाउनलोड करें',
    'Print / Save as PDF': 'प्रिंट / PDF के रूप में सेव करें', 'No vendor quotation requested yet.': 'अभी तक विक्रेता कोटेशन का अनुरोध नहीं किया गया।',
    'Welcome back,': 'वापसी पर स्वागत है,', 'Account Status:': 'खाता स्थिति:', 'Vendor Isolated Data': 'विक्रेता का अलग डेटा',
    'Total Quote Requests': 'कुल कोटेशन अनुरोध', 'Pending Approvals': 'लंबित अनुमोदन',
    'Completed Installations': 'पूरी हुई स्थापनाएं', 'Total Business Value': 'कुल व्यवसाय मूल्य',
    'SolarAssist Smart Tools': 'SolarAssist स्मार्ट टूल्स', 'Verified Solar Vendors': 'सत्यापित सोलर विक्रेता',
  },
  mr: {
    'Dashboard': 'डॅशबोर्ड', 'Solar Planner': 'सोलर प्लॅनर', 'My Recommendation': 'माझी शिफारस',
    'Financial Analysis': 'आर्थिक विश्लेषण', 'Verified Vendors': 'पडताळलेले विक्रेते', 'Reports': 'अहवाल',
    'My Products & Services': 'माझी उत्पादने आणि सेवा', 'Add New Product / Service': 'नवीन उत्पादन / सेवा जोडा',
    'Available': 'उपलब्ध', 'Out of Stock': 'स्टॉकमध्ये नाही', 'Edit': 'संपादित करा', 'Delete': 'हटवा',
    'Incoming Customer Requests': 'आलेली ग्राहक विनंती', 'Request Overview': 'विनंतीचा आढावा',
    'Customer Info': 'ग्राहक माहिती', 'System Requirement': 'सिस्टमची गरज', 'Update Request Status': 'विनंतीची स्थिती अपडेट करा',
    'Accept Quote': 'कोटेशन स्वीकारा', 'Complete Job': 'काम पूर्ण करा', 'Reject Request': 'विनंती नाकारा',
    'Accept': 'स्वीकारा', 'Reject': 'नाकारा', 'PENDING': 'प्रलंबित', 'ACCEPTED': 'स्वीकृत',
    'COMPLETED': 'पूर्ण', 'REJECTED': 'नाकारले', 'Price:': 'किंमत:', 'Warranty:': 'वॉरंटी:',
    'Capacity:': 'क्षमता:', 'Location:': 'ठिकाण:', 'Service Package:': 'सेवा पॅकेज:',
    'Customer Name': 'ग्राहकाचे नाव', 'Service': 'सेवा', 'Date': 'दिनांक', 'Status': 'स्थिती',
    'My Solar Report': 'माझा सोलर अहवाल', 'Open Report': 'अहवाल उघडा', 'Download Report': 'अहवाल डाउनलोड करा',
    'Print / Save as PDF': 'प्रिंट / PDF म्हणून सेव्ह करा', 'No vendor quotation requested yet.': 'अद्याप विक्रेत्याकडे कोटेशनची विनंती केलेली नाही.',
    'Welcome back,': 'पुन्हा स्वागत आहे,', 'Account Status:': 'खात्याची स्थिती:', 'Vendor Isolated Data': 'विक्रेत्याचा स्वतंत्र डेटा',
    'Total Quote Requests': 'एकूण कोटेशन विनंत्या', 'Pending Approvals': 'प्रलंबित मंजुरी',
    'Completed Installations': 'पूर्ण झालेल्या स्थापना', 'Total Business Value': 'एकूण व्यवसाय मूल्य',
    'SolarAssist Smart Tools': 'SolarAssist स्मार्ट टूल्स', 'Verified Solar Vendors': 'पडताळलेले सोलर विक्रेते',
  },
};

const originalText = new WeakMap();

function translatePage(language) {
  const dictionary = translations[language];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach((textNode) => {
    if (!originalText.has(textNode)) originalText.set(textNode, textNode.nodeValue);
    const source = originalText.get(textNode);
    const trimmed = source.trim();
    if (!trimmed || textNode.parentElement?.closest('script,style,textarea,input,select')) return;
    if (!dictionary) {
      textNode.nodeValue = source;
      return;
    }
    const translated = dictionary[trimmed];
    if (translated) textNode.nodeValue = source.replace(trimmed, translated);
  });
}

export default function PageTextTranslator() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const apply = () => translatePage(i18n.language);
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [i18n]);
  return null;
}
