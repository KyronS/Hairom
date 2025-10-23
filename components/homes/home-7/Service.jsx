import React from "react";
import Image from "next/image";
export default function Service() {
  return (
    <div className="container position-relative">
      <div className="row">
        <div className="col-lg-8 offset-lg-2 text-center">
          <h2 className="section-title mb-30 mb-sm-20">
                <span className="text-gray">Our</span> Services
                <span className="text-gray">.</span>
          </h2>
          <div className="section-line-gold mx-auto mb-20" />
          <h3 className="section-title mb-40 mb-sm-30">
            Your Crown, Your Rules – We Just Perfect Them.
          </h3>
          <p className="text-gray mb-80 mb-sm-60">The price is determined by the length of hair and many other details to ensure that your crown is adjusted successfully.
          Message me privately for an official consultation.
          </p>
        </div>
      </div>
      <div className="row wow fadeInUp">
        {/* Services Tabs */}
        <div className="col-lg-5 col-xl-4 mb-md-50 mb-sm-30">
          <ul className="nav nav-tabs services-7-tabs" role="tablist">
            <li>
              <a
                href="#services-item-1a"
                className="active"
                aria-controls="services-item-1a"
                role="tab"
                aria-selected="true"
                data-bs-toggle="tab"
              >
                <h4 className="services-7-title">Haircuts</h4>
                <div className="services-7-text">
                </div>
                <div className="services-7-arrow">
                  <i className="mi-arrow-right size-24" />
                </div>
              </a>
            </li>
            <li>
              <a
                href="#services-item-2a"
                aria-controls="services-item-2a"
                role="tab"
                aria-selected="false"
                data-bs-toggle="tab"
              >
                <h4 className="services-7-title">Locs</h4>
                <div className="services-7-text">
                </div>
                <div className="services-7-arrow">
                  <i className="mi-arrow-right size-24" />
                </div>
              </a>
            </li>
            <li>
              <a
                href="#services-item-3a"
                aria-controls="services-item-3a"
                role="tab"
                aria-selected="false"
                data-bs-toggle="tab"
              >
                <h4 className="services-7-title">Natural Hairstyles</h4>
                <div className="services-7-text">
                </div>
                <div className="services-7-arrow">
                  <i className="mi-arrow-right size-24" />
                </div>
              </a>
            </li>
            <li>
              <a
                href="#services-item-4a"
                aria-controls="services-item-4a"
                role="tab"
                aria-selected="false"
                data-bs-toggle="tab"
              >
                <h4 className="services-7-title">Hair Dye</h4>
                <div className="services-7-text">
                </div>
                <div className="services-7-arrow">
                  <i className="mi-arrow-right size-24" />
                </div>
              </a>
            </li>
          </ul>
        </div>
        {/* End Services Tabs */}
        {/* Services Images */}
        <div className="col-lg-7 offset-xl-1">
          <div className="tab-content position-sticky">
            {/* Tab Image */}
            <div
              className="tab-pane show fade active"
              id="services-item-1a"
              role="tabpanel"
            >
              <div className="services-7-content">
                <div className="services-7-image">
                  <Image
                    src="/assets/images/demo-elegant/services/service-1.jpg"
                    width={1000}
                    height={790}
                    alt="Image Description"
                  />
                </div>
              </div>
            </div>
            {/* End Tab Image */}
            {/* Tab Image */}
            <div
              className="tab-pane show fade"
              id="services-item-2a"
              role="tabpanel"
            >
              <div className="services-7-content">
                <div className="services-7-image">
                  <Image
                    src="/assets/images/demo-elegant/services/service-2.jpg"
                    alt="Image Description"
                    width={1000}
                    height={790}
                  />
                </div>
              </div>
            </div>
            {/* End Tab Image */}
            {/* Tab Image */}
            <div
              className="tab-pane show fade"
              id="services-item-3a"
              role="tabpanel"
            >
              <div className="services-7-content">
                <div className="services-7-image">
                  <Image
                    src="/assets/images/demo-elegant/services/service-3.jpg"
                    alt="Image Description"
                    width={1000}
                    height={790}
                  />
                </div>
              </div>
            </div>
            {/* End Tab Image */}
            {/* Tab Image */}
            <div
              className="tab-pane show fade"
              id="services-item-4a"
              role="tabpanel"
            >
              <div className="services-7-content">
                <div className="services-7-image">
                  <Image
                    src="/assets/images/demo-elegant/services/service-4.jpg"
                    alt="Image Description"
                    width={1000}
                    height={790}
                  />
                </div>
              </div>
            </div>
            {/* End Tab Image */}
          </div>
        </div>
        {/* End Services Images */}
      </div>
    </div>
  );
}
