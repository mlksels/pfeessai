(function () {
    function currentDayValue() {
        const input = document.getElementById('currentDay');
        if (!input) return new Date().toISOString().split('T')[0];
        if (!input.value) input.value = new Date().toISOString().split('T')[0];
        return input.value;
    }

    function showView(view) {
        ['calendar', 'weekly', 'daily', 'list'].forEach((name) => {
            const section = document.getElementById(name + 'View');
            if (!section) return;
            section.style.display = name === view ? 'block' : 'none';
            section.classList.toggle('active', name === view);
        });

        document.querySelectorAll('.nav-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });
    }

    function safeRender(view) {
        showView(view);

        try {
            if (!window.planningManager) return;
            if (view === 'weekly' && typeof window.planningManager.loadWeeklyView === 'function') {
                window.planningManager.loadWeeklyView();
            }
            if (view === 'daily' && typeof window.planningManager.loadDailyView === 'function') {
                window.planningManager.loadDailyView(currentDayValue());
            }
            if (view === 'list' && typeof window.planningManager.loadListView === 'function') {
                window.planningManager.loadListView();
            }
        } catch (_) {}
    }

    function initFallbackTabs() {
        document.querySelectorAll('.nav-tab').forEach((tab) => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                safeRender(tab.dataset.view);
            });
        });

        document.getElementById('currentDay')?.addEventListener('change', () => {
            if (document.getElementById('dailyView')?.classList.contains('active')) {
                safeRender('daily');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', initFallbackTabs);
})();
