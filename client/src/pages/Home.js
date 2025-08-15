import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  // שימוש ב־AuthContext כדי לדעת אם יש משתמש מחובר ולשנות CTA בהתאם.
  // ההחלטה: לא להחזיק state מקומי, אלא לצרוך ישירות מה־Context כדי למנוע כפילויות.
  const { user } = useAuth();

  return (
    // שימוש ב־<section> לצורך סמנטיקה ונגישות. מרכוז אנכי/אופקי עם מרווחים רספונסיביים.
    <section className="text-center py-16">
      <div className="max-w-4xl mx-auto">
        {/* כותרת ראשית: חלוקה לשני חלקים כדי לאפשר הדגשת "Trip" בעיצוב מבלי לשבור את מבנה ה־H1 */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Plan Your Perfect
          <span className="text-blue-600"> Trip</span>
        </h1>

        {/* טקסט פתיח: רוחב מקסימלי כדי לשמור קריאות במסכים רחבים, וצבע אפור רך לשיפור היררכיה ויזואלית */}
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover amazing hiking and cycling routes with AI-powered planning, 
          weather forecasts, and interactive maps. Your next adventure starts here.
        </p>

        {/* מכולת כפתורים רספונסיבית: עמודה במובייל ושורה במסכים גדולים יותר.
            החלטת עיצוב: לייצר CTA כפול, שמותאם למצב אימות, לשיפור המרה. */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              {/* ניווט פנימי עם <Link> של react-router לשמירה על SPA ללא רענון עמוד */}
              <Link to="/plan" className="btn btn-primary text-lg px-8 py-3">
                Plan New Trip
              </Link>
              <Link to="/routes" className="btn btn-secondary text-lg px-8 py-3">
                View My Routes
              </Link>
            </>
          ) : (
            <>
              {/* במצב לא מחובר: דוחפים ל־register כפעולה ראשית, ו־login כאופציה משנית */}
              <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Home;
